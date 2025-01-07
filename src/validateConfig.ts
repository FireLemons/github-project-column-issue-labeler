import { Logger } from './logger'
import { Column, Config, LabelingAction, LabelingRule, Project } from './configObjects'
import * as typeChecker from './typeChecker'
import { caseInsensitiveCompare, caseInsensitiveAlphabetization, removeCaseInsensitiveDuplicatesFromSortedArray } from './util'
import { ProjectPrimaryKeyHumanReadable } from './githubObjects'

export default class ConfigValidator {
  logger: Logger

  constructor (logger: Logger) {
    this.logger = logger
  }

  validateConfig (config: string): Config | null {
    this.logger.info('Validating Config')
    let configAsObject

    try {
      try {
        configAsObject = JSON.parse(config)
      } catch (error) {
        throw new SyntaxError('Could not parse config as JSON')
      }

      if (!(typeChecker.isObject(configAsObject))) {
        throw new TypeError('The config must be an object')
      }

      typeChecker.validateObjectMember(configAsObject, 'accessToken', typeChecker.Type.string)
      typeChecker.validateObjectMember(configAsObject, 'repo', typeChecker.Type.object)

      const configRepo = this.#validateRepo(configAsObject.repo)
      const trimmedGithubAccessToken = configAsObject.accessToken.trim()

      if (!(trimmedGithubAccessToken.length)) {
        throw new RangeError('The github access token cannot be empty or contain only whitespace')
      }

      const validatedConfig: Config = {
        accessToken: trimmedGithubAccessToken,
        repo: {
          ownerName: configRepo.ownerName.trim(),
          name: configRepo.name.trim()
        }
      }

      this.logger.addBaseIndentation(2)

      if ('projects' in configAsObject) {
        this.logger.info('Found projects in config')
        this.logger.addBaseIndentation(2)
        typeChecker.validateObjectMember(configAsObject, 'projects', typeChecker.Type.array)

        const validatedProjects = this.#validateProjects(configAsObject.projects)

        if (validatedProjects.length === 0) {
          throw new ReferenceError('Config does not contain any valid projects')
        }

        validatedConfig.projects = validatedProjects
      } else if ('columns' in configAsObject) {
        this.logger.info('Found columns in config')
        this.logger.addBaseIndentation(2)
        typeChecker.validateObjectMember(configAsObject, 'columns', typeChecker.Type.array)
        const validatedColumns = this.#validateColumns(configAsObject.columns)

        if (validatedColumns.length === 0) {
          throw new ReferenceError('Config does not contain any valid columns')
        }

        validatedConfig.columns = validatedColumns
      } else {
        this.logger.addBaseIndentation(-4)
        throw new ReferenceError('Missing keys "projects" and "columns". One is required')
      }

      this.logger.addBaseIndentation(-4)

      this.logger.info('Validated Config:')
      this.logger.info(JSON.stringify(validatedConfig, null, 2))

      return validatedConfig
    } catch (error) {
      this.logger.addBaseIndentation(-4)

      this.logger.error('Failed to validate config')
      this.logger.tryErrorLogErrorObject(error, 2)

      return null
    }
  }

  #determineLabelingRules (rules: LabelingRule[]): Map<LabelingAction, string[]> {
    const lastSetRuleIndex = rules.findLastIndex((rule) => rule.action === LabelingAction.SET)
    let determinedLabelingRules: Map<LabelingAction, string[]>

    if (lastSetRuleIndex >= 0) {
      this.logger.info(`Found SET labeling rule at index: ${lastSetRuleIndex}`)
      this.logger.info('The column will be using only this rule', 2)
      const lastSetRule = rules[lastSetRuleIndex]

      determinedLabelingRules = new Map(
        [
          [lastSetRule.action, lastSetRule.labels]
        ]
      )
    } else {
      this.logger.info('Labeling rules list only contains ADD or REMOVE rules. All rules will be used.')
      this.logger.info('Grouping labels by action')
      determinedLabelingRules = this.#groupLabelsByAction(rules)
    }

    return determinedLabelingRules
  }

  filterShallowInvalidColumnsAndGroupDuplicates (unvalidatedColumns: any[]) {
    this.logger.info('Validating items in column array and handling possible duplicates')

    const columnMap: Map<string, any[]> = new Map()

    unvalidatedColumns.forEach((column: any, index: number) => {
      this.logger.addBaseIndentation(2)
      this.logger.info(`Validating column at index ${index}`)
      this.logger.addBaseIndentation(2)

      try {
        const shallowValidatedColumn = this.#shallowValidateColumn(column)
        this.#groupColumn(shallowValidatedColumn, columnMap)
      } catch (error) {
        this.logger.warn(`Could not make valid column from value at index: ${index}. Skipping column.`)
        this.logger.tryWarnLogErrorObject(error, 2)
      }

      this.logger.addBaseIndentation(-4)
    })

    return columnMap
  }

  #filterShallowInvalidProjectsAndGroupDuplicates (unvalidatedProjects: any[]) {
    const projectMap: Map<string, Map<number, any[]>> = new Map()

    this.logger.info('Validating items in project array and handling possible duplicates')

    unvalidatedProjects.forEach((project: any, index: number) => {
      this.logger.addBaseIndentation(2)

      this.logger.info(`Validating project at index ${index}`)
      this.logger.addBaseIndentation(2)

      try {
        this.#groupProject(this.#shallowValidateProject(project), projectMap)
      } catch (error) {
        this.logger.warn(`Could not make valid project from value at index: ${index}. Skipping project.`)
        this.logger.tryWarnLogErrorObject(error, 2)
      }

      this.logger.addBaseIndentation(-4)
    })

    return projectMap
  }

  #groupColumn (shallowValidatedColumn: { name: string, labelingRules: any[] }, columnMap: Map<string, any[]>) {
    const columnName = shallowValidatedColumn.name

    if (columnMap.has(columnName)) {
      columnMap.get(shallowValidatedColumn.name)!.push(...shallowValidatedColumn.labelingRules)
      this.logger.warn(`Found multiple columns with name:"${columnName}". Combining labeling rules.`)
    } else {
      columnMap.set(shallowValidatedColumn.name, shallowValidatedColumn.labelingRules)
    }
  }

  #groupProject (shallowValidatedProject: { columns: any[], projectKey: ProjectPrimaryKeyHumanReadable }, projectMap: Map<string, Map<number, any[]>>) {
    const projectOwnerName = shallowValidatedProject.projectKey.getName()
    const projectNumber: number = shallowValidatedProject.projectKey.getNumber() ?? 0
    let projectNumberMap: Map<number, any[]>

    if (projectMap.has(projectOwnerName)) {
      projectNumberMap = projectMap.get(projectOwnerName)!
    } else {
      projectNumberMap = new Map()
      projectNumberMap.set(projectNumber, shallowValidatedProject.columns)
      projectMap.set(projectOwnerName, projectNumberMap)
      return
    }

    if (projectNumberMap.has(projectNumber)) {
      projectNumberMap.get(projectNumber)!.push(...shallowValidatedProject.columns)
      this.logger.warn(`Found multiple projects with owner:"${projectOwnerName}" and number:${projectNumber === 0 ? 'null' : projectNumber}. Combining columns.`)
    } else {
      projectNumberMap.set(projectNumber, shallowValidatedProject.columns)
    }
  }

  #groupLabelsByAction (rules: LabelingRule[]): Map<LabelingAction, string[]> {
    const consolidatedLabels: Map<LabelingAction, string[]> = new Map()

    for (const rule of rules) {
      const { action } = rule
      if (consolidatedLabels.has(action)) {
        consolidatedLabels.get(action)!.push(...rule.labels)
      } else {
        consolidatedLabels.set(action, rule.labels)
      }
    }

    return consolidatedLabels
  }

  hasAddAndRemoveRule (labelingRuleMap: Map<LabelingAction, string[]>) {
    return labelingRuleMap.has(LabelingAction.ADD) && labelingRuleMap.has(LabelingAction.REMOVE)
  }

  isLabelingAction (str: string): str is LabelingAction {
    return Object.keys(LabelingAction).includes(str)
  }

  labelingRuleMapToArray (labelingRuleMap: Map<LabelingAction, string[]>): LabelingRule[] {
    const labelingRules = []

    for (const [labelingAction, labels] of labelingRuleMap) {
      labelingRules.push({
        action: labelingAction,
        labels: labels
      })
    }

    return labelingRules
  }

  #removeDuplicateLabelsFromLabelingRules (labelingRuleMap: Map<LabelingAction, string[]>) {
    for (const [action, labels] of labelingRuleMap) {
      const labelsWithoutDuplicates = removeCaseInsensitiveDuplicatesFromSortedArray(caseInsensitiveAlphabetization(labels))

      if (labelsWithoutDuplicates.length < labels.length) {
        this.logger.warn(`Labels for action ${action} were found to have duplicate labels. Removed duplicate labels.`)
        labelingRuleMap.set(action, labelsWithoutDuplicates)
      }
    }
  }

  #removeMatchingCaseInsensitiveLabelsBetweenArrays (sortedArray1: string[], sortedArray2: string[]) {
    let cursor1 = 0
    let cursor2 = 0

    while (cursor1 < sortedArray1.length && cursor2 < sortedArray2.length) {
      const comparison = caseInsensitiveCompare(sortedArray1[cursor1], sortedArray2[cursor2])

      if (comparison < 0) {
        cursor1++
      } else if (comparison > 0) {
        cursor2++
      } else {
        this.logger.warn(`Found same label: "${sortedArray1[cursor1]}" in both ADD and REMOVE labeling rules. Removing label.`)
        sortedArray1.splice(cursor1, 1)
        sortedArray2.splice(cursor2, 1)
      }
    }
  }

  #shallowValidateColumn (object: any): Column {
    if (!typeChecker.isObject(object)) {
      throw new TypeError('Column must be an object')
    }

    typeChecker.validateObjectMember(object, 'name', typeChecker.Type.string)

    const validatedName = object.name.trim()

    if (!(validatedName.length)) {
      throw new ReferenceError('name must contain at least one non whitespace character')
    }

    typeChecker.validateObjectMember(object, 'labelingRules', typeChecker.Type.array)

    return {
      name: validatedName,
      labelingRules: object.labelingRules
    }
  }

  #shallowValidateProject (object: any): Project {
    if (!typeChecker.isObject(object)) {
      throw new TypeError('Project must be an object')
    }

    typeChecker.validateObjectMember(object, 'columns', typeChecker.Type.array)
    typeChecker.validateObjectMember(object, 'ownerLogin', typeChecker.Type.string)

    const trimmedOwnerLogin = object.ownerLogin.trim()

    let validatedProject: Project

    if ('number' in object) {
      typeChecker.validateObjectMember(object, 'number', typeChecker.Type.number)

      if (!(Number.isInteger(object.number))) {
        throw new TypeError('Number must be an integer')
      }

      if (object.number < 1) {
        throw new RangeError('Number must be greater than 0')
      }

      validatedProject = {
        columns: object.columns,
        projectKey: new ProjectPrimaryKeyHumanReadable(trimmedOwnerLogin, object.number)
      }
    } else {
      validatedProject = {
        columns: object.columns,
        projectKey: new ProjectPrimaryKeyHumanReadable(trimmedOwnerLogin)
      }
    }

    if (!(trimmedOwnerLogin.length)) {
      throw new ReferenceError('ownerLogin must contain at least one non whitespace character')
    }

    return validatedProject
  }

  #validateChildrenOfColumns (shallowValidatedColumnMap: Map<string, any[]>) {
    this.logger.info('Validating labeling rules for valid columns')

    const validatedColumns: Column[] = []

    for (const [columnName, labelingRules] of shallowValidatedColumnMap) {
      this.logger.addBaseIndentation(2)

      this.logger.info(`Validating labeling rules of column with name:"${columnName}"`)
      this.logger.addBaseIndentation(2)

      const determinedLabelingRules = this.#determineLabelingRules(this.#validateLabelingRules(labelingRules))

      this.#removeDuplicateLabelsFromLabelingRules(determinedLabelingRules)

      if (this.hasAddAndRemoveRule(determinedLabelingRules)) {
        this.#removeMatchingCaseInsensitiveLabelsBetweenArrays(determinedLabelingRules.get(LabelingAction.ADD)!, determinedLabelingRules.get(LabelingAction.REMOVE)!)
      }

      const validatedLabelingRules = this.labelingRuleMapToArray(determinedLabelingRules)

      if (validatedLabelingRules.length !== 0) {
        validatedColumns.push({
          labelingRules: validatedLabelingRules,
          name: columnName
        })
      } else {
        this.logger.warn(`Column with name:"${columnName}" did not contain any valid labeling rules. Skipping column.`, 2)
      }

      this.logger.addBaseIndentation(-4)
    }

    return validatedColumns
  }

  #validateChildrenOfProjects (shallowValidatedProjectMap: Map<string, Map<number, any[]>>) {
    this.logger.info('Validating columns for valid projects')
    this.logger.addBaseIndentation(2)

    const validatedProjects: Project[] = []

    for (const [projectOwnerName, projectNumberMap] of shallowValidatedProjectMap) {
      let numberLessColumns = projectNumberMap.get(0)

      projectNumberMap.delete(0)

      if (numberLessColumns !== undefined) {
        this.logger.info(`Validating labeling rules of project with with owner name:"${projectOwnerName}"`)

        this.logger.addBaseIndentation(2)
        numberLessColumns = this.#validateColumns(numberLessColumns)

        if (numberLessColumns.length !== 0) {
          validatedProjects.push({
            columns: numberLessColumns,
            projectKey: new ProjectPrimaryKeyHumanReadable(projectOwnerName)
          })
        } else {
          this.logger.warn(`Project with owner name:"${projectOwnerName}" and no number did not contain any valid columns. Skipping project.`)
        }

        this.logger.addBaseIndentation(-2)
      }

      for (const [projectNumber, unvalidatedColumns] of projectNumberMap) {
        this.logger.info(`Validating labeling rules of project with with owner name:"${projectOwnerName}" and number: ${projectNumber}`)

        this.logger.addBaseIndentation(2)
        const validatedColumns = this.#validateColumns(unvalidatedColumns)

        if (validatedColumns.length !== 0) {
          validatedProjects.push({
            columns: validatedColumns,
            projectKey: new ProjectPrimaryKeyHumanReadable(projectOwnerName, projectNumber)
          })
        } else {
          this.logger.warn(`Project with owner name:"${projectOwnerName}" and number:"${projectNumber}" did not contain any valid columns. Skipping project.`)
        }
      }

      this.logger.addBaseIndentation(-2)
    }

    this.logger.addBaseIndentation(-4)

    return validatedProjects
  }

  #validateColumns (unvalidatedColumns: any[]): Column[] {
    return this.#validateChildrenOfColumns(this.filterShallowInvalidColumnsAndGroupDuplicates(unvalidatedColumns))
  }

  #validateLabelingRule (object: any): LabelingRule {
    if (!typeChecker.isObject(object)) {
      throw new TypeError('Labeling rule must be an object')
    }

    typeChecker.validateObjectMember(object, 'action', typeChecker.Type.string)

    const formattedAction = object.action.toUpperCase().trim()

    if (!(this.isLabelingAction(formattedAction))) {
      throw new RangeError(`Labeling action "${formattedAction}" is not supported. Supported actions are: ${JSON.stringify(Object.keys(LabelingAction))}`)
    }

    typeChecker.validateObjectMember(object, 'labels', typeChecker.Type.array)

    return {
      action: formattedAction,
      labels: this.#validateLabels(object.labels)
    }
  }

  #validateLabelingRules (arr: any[]): LabelingRule[] {
    const validatedLabelingRules: LabelingRule[] = []

    arr.forEach((labelingRule: any, index: number) => {
      this.logger.info(`Checking labeling rule at index ${index}`)
      this.logger.addBaseIndentation(2)

      try {
        const validatedLabelingRule = this.#validateLabelingRule(labelingRule)

        if (validatedLabelingRule.labels.length !== 0) {
          validatedLabelingRules.push(validatedLabelingRule)
        } else {
          this.logger.warn(`Labeling rule at index: ${index} did not contain any valid labels. Skipping rule.`)
        }
      } catch (error) {
        this.logger.warn(`Could not make valid labeling rule from value at index: ${index}. Skipping rule.`)
        this.logger.tryWarnLogErrorObject(error, 2)
      }

      this.logger.addBaseIndentation(-2)
    })

    return validatedLabelingRules
  }

  #validateLabels (arr: any[]): string[] {
    const validatedLabels: string[] = []

    arr.forEach((label: any, index: number) => {
      if (!(typeChecker.isString(label))) {
        this.logger.warn(`Label at index: ${index} was found not to be a string. Removing value.`)
      } else {
        const trimmedLabel = label.trim()

        if (trimmedLabel.length !== 0) {
          validatedLabels.push(trimmedLabel)
        } else {
          this.logger.warn(`Label at index: ${index} must contain at least one non whitespace character. Removing value.`)
        }
      }
    })

    return validatedLabels
  }

  #validateProjects (unvalidatedProjects: any[]): Project[] {
    return this.#validateChildrenOfProjects(this.#filterShallowInvalidProjectsAndGroupDuplicates(unvalidatedProjects))
  }

  #validateRepo (unvalidatedRepo: {
    [key: string]: string
  }) {
    typeChecker.validateObjectMember(unvalidatedRepo, 'name', typeChecker.Type.string)
    typeChecker.validateObjectMember(unvalidatedRepo, 'ownerName', typeChecker.Type.string)

    const trimmedName = unvalidatedRepo.name.trim()
    const trimmedOwnerName = unvalidatedRepo.ownerName.trim()

    if (!(trimmedName.length)) {
      throw new ReferenceError('name must contain at least one non whitespace character')
    }

    if (!(trimmedOwnerName.length)) {
      throw new ReferenceError('ownerName must contain at least one non whitespace character')
    }

    return {
      name: trimmedName,
      ownerName: trimmedOwnerName
    }
  }
}