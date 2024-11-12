import { Logger } from './logger'
import { Column, Config, LabelingAction, LabelingRule, Project } from './configObjects'
import * as typeChecker from './typeChecker'
import { caseInsensitiveCompare, caseInsensitiveAlphabetization, removeCaseInsensitiveDuplicatesFromSortedArray } from './util'

const logger = new Logger()

function determineLabelingRules (rules: LabelingRule[]): Map<LabelingAction, string[]> {
  const lastSetRuleIndex = rules.findLastIndex((rule) => rule.action === LabelingAction.SET)
  let determinedLabelingRules: Map<LabelingAction, string[]>

  if (lastSetRuleIndex >= 0) {
    logger.info(`Found SET labeling rule at index: ${lastSetRuleIndex}`)
    logger.info('The column will be using only this rule', 2)
    const lastSetRule = rules[lastSetRuleIndex]

    determinedLabelingRules = new Map(
      [
        [lastSetRule.action, lastSetRule.labels]
      ]
    )
  } else {
    logger.info('Labeling rules list only contains ADD or REMOVE rules. All rules will be used.')
    logger.info('Grouping labels by action')
    determinedLabelingRules = groupLabelsByAction(rules)
  }

  return determinedLabelingRules
}

function filterShallowInvalidColumnsAndGroupDuplicates (unvalidatedColumns: any[]) {
  logger.info('Validating items in column array and handling possible duplicates')

  const columnMap: Map<string, any[]> = new Map()

  unvalidatedColumns.forEach((column: any, index: number) => {
    logger.addBaseIndentation(2)
    logger.info(`Validating column at index ${index}`)
    logger.addBaseIndentation(2)

    try {
      const shallowValidatedColumn = shallowValidateColumn(column)
      groupColumn(shallowValidatedColumn, columnMap)
    } catch (error) {
      logger.warn(`Could not make valid column from value at index: ${index}. Skipping column.`)
      logger.tryWarnLogErrorObject(error, 2)
    }

    logger.addBaseIndentation(-4)
  })

  return columnMap
}

function filterShallowInvalidProjectsAndGroupDuplicates (unvalidatedProjects: any[]) {
  const projectMap: Map<string, Map<number, any[]>> = new Map()

  logger.info('Validating items in project array and handling possible duplicates')

  unvalidatedProjects.forEach((project: any, index: number) => {
    logger.addBaseIndentation(2)

    logger.info(`Validating project at index ${index}`)
    logger.addBaseIndentation(2)

    try {
      groupProject(shallowValidateProject(project), projectMap)
    } catch (error) {
      logger.warn(`Could not make valid project from value at index: ${index}. Skipping project.`)
      logger.tryWarnLogErrorObject(error, 2)
    }

    logger.addBaseIndentation(-4)
  })

  return projectMap
}

function groupColumn (shallowValidatedColumn: { name: string, labelingRules: any[] }, columnMap: Map<string, any[]>) {
  const columnName = shallowValidatedColumn.name

  if (columnMap.has(columnName)) {
    columnMap.get(shallowValidatedColumn.name)!.push(...shallowValidatedColumn.labelingRules)
    logger.warn(`Found multiple columns with name:"${columnName}". Combining labeling rules.`)
  } else {
    columnMap.set(shallowValidatedColumn.name, shallowValidatedColumn.labelingRules)
  }
}

function groupProject (shallowValidatedProject: { columns: any[], number?: number, ownerLogin: string }, projectMap: Map<string, Map<number, any[]>>) {
  const projectOwnerName = shallowValidatedProject.ownerLogin
  const projectNumber: number = shallowValidatedProject.number ?? 0
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
    logger.warn(`Found multiple projects with owner:"${projectOwnerName}" and number:${projectNumber === 0 ? 'null' : projectNumber}. Combining columns.`)
  } else {
    projectNumberMap.set(projectNumber, shallowValidatedProject.columns)
  }
}

function groupLabelsByAction (rules: LabelingRule[]): Map<LabelingAction, string[]> {
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

function hasAddAndRemoveRule (labelingRuleMap: Map<LabelingAction, string[]>) {
  return labelingRuleMap.has(LabelingAction.ADD) && labelingRuleMap.has(LabelingAction.REMOVE)
}

function isLabelingAction (str: string): str is LabelingAction {
  return Object.keys(LabelingAction).includes(str)
}

function labelingRuleMapToArray (labelingRuleMap: Map<LabelingAction, string[]>): LabelingRule[] {
  const labelingRules = []

  for (const [labelingAction, labels] of labelingRuleMap) {
    labelingRules.push({
      action: labelingAction,
      labels: labels
    })
  }

  return labelingRules
}

function removeDuplicateLabelsFromLabelingRules (labelingRuleMap: Map<LabelingAction, string[]>) {
  for (const [action, labels] of labelingRuleMap) {
    const labelsWithoutDuplicates = removeCaseInsensitiveDuplicatesFromSortedArray(caseInsensitiveAlphabetization(labels))

    if (labelsWithoutDuplicates.length < labels.length) {
      logger.warn(`Labels for action ${action} were found to have duplicate labels. Removed duplicate labels.`)
      labelingRuleMap.set(action, labelsWithoutDuplicates)
    }
  }
}

function removeMatchingCaseInsensitiveLabelsBetweenArrays (sortedArray1: string[], sortedArray2: string[]) {
  let cursor1 = 0
  let cursor2 = 0

  while (cursor1 < sortedArray1.length && cursor2 < sortedArray2.length) {
    const comparison = caseInsensitiveCompare(sortedArray1[cursor1], sortedArray2[cursor2])

    if (comparison < 0) {
      cursor1++
    } else if (comparison > 0) {
      cursor2++
    } else {
      logger.warn(`Found same label: "${sortedArray1[cursor1]}" in both ADD and REMOVE labeling rules. Removing label.`)
      sortedArray1.splice(cursor1, 1)
      sortedArray2.splice(cursor2, 1)
    }
  }
}

function shallowValidateColumn (object: any): Column {
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

function shallowValidateProject (object: any): Project {
  if (!typeChecker.isObject(object)) {
    throw new TypeError('Project must be an object')
  }

  typeChecker.validateObjectMember(object, 'columns', typeChecker.Type.array)
  typeChecker.validateObjectMember(object, 'ownerLogin', typeChecker.Type.string)

  const trimmedOwnerLogin = object.ownerLogin.trim()

  const validatedProject: Project = {
    columns: object.columns,
    ownerLogin: trimmedOwnerLogin
  }

  if ('number' in object) {
    typeChecker.validateObjectMember(object, 'number', typeChecker.Type.number)

    if (!(Number.isInteger(object.number))) {
      throw new TypeError('Number must be an integer')
    }

    if (object.number < 1) {
      throw new RangeError('Number must be greater than 0')
    }

    validatedProject.number = object.number
  }

  if (!(trimmedOwnerLogin.length)) {
    throw new ReferenceError('ownerLogin must contain at least one non whitespace character')
  }

  return validatedProject
}

function validateChildrenOfColumns (shallowValidatedColumnMap: Map<string, any[]>) {
  logger.info('Validating labeling rules for valid columns')

  const validatedColumns: Column[] = []

  for (const [columnName, labelingRules] of shallowValidatedColumnMap) {
    logger.addBaseIndentation(2)

    logger.info(`Validating labeling rules of column with name:"${columnName}"`)
    logger.addBaseIndentation(2)

    const determinedLabelingRules = determineLabelingRules(validateLabelingRules(labelingRules))

    removeDuplicateLabelsFromLabelingRules(determinedLabelingRules)

    if (hasAddAndRemoveRule(determinedLabelingRules)) {
      removeMatchingCaseInsensitiveLabelsBetweenArrays(determinedLabelingRules.get(LabelingAction.ADD)!, determinedLabelingRules.get(LabelingAction.REMOVE)!)
    }

    const validatedLabelingRules = labelingRuleMapToArray(determinedLabelingRules)

    if (validatedLabelingRules.length !== 0) {
      validatedColumns.push({
        labelingRules: validatedLabelingRules,
        name: columnName
      })
    } else {
      logger.warn(`Column with name:"${columnName}" did not contain any valid labeling rules. Skipping column.`, 2)
    }

    logger.addBaseIndentation(-4)
  }

  return validatedColumns
}

function validateChildrenOfProjects (shallowValidatedProjectMap: Map<string, Map<number, any[]>>) {
  logger.info('Validating columns for valid projects')
  logger.addBaseIndentation(2)

  const validatedProjects: Project[] = []

  for (const [projectOwnerName, projectNumberMap] of shallowValidatedProjectMap) {
    let numberLessColumns = projectNumberMap.get(0)

    projectNumberMap.delete(0)

    if (numberLessColumns !== undefined) {
      logger.info(`Validating labeling rules of project with with owner name:"${projectOwnerName}"`)

      logger.addBaseIndentation(2)
      numberLessColumns = validateColumns(numberLessColumns)

      if (numberLessColumns.length !== 0) {
        validatedProjects.push({
          columns: numberLessColumns,
          ownerLogin: projectOwnerName
        })
      } else {
        logger.warn(`Project with owner name:"${projectOwnerName}" and no number did not contain any valid columns. Skipping project.`)
      }

      logger.addBaseIndentation(-2)
    }

    for (const [projectNumber, unvalidatedColumns] of projectNumberMap) {
      logger.info(`Validating labeling rules of project with with owner name:"${projectOwnerName}" and number: ${projectNumber}`)

      logger.addBaseIndentation(2)
      const validatedColumns = validateColumns(unvalidatedColumns)

      if (validatedColumns.length !== 0) {
        validatedProjects.push({
          columns: validatedColumns,
          number: projectNumber,
          ownerLogin: projectOwnerName
        })
      } else {
        logger.warn(`Project with owner name:"${projectOwnerName}" and number:"${projectNumber}" did not contain any valid columns. Skipping project.`)
      }
    }

    logger.addBaseIndentation(-2)
  }

  logger.addBaseIndentation(-4)

  return validatedProjects
}

function validateColumns (unvalidatedColumns: any[]): Column[] {
  return validateChildrenOfColumns(filterShallowInvalidColumnsAndGroupDuplicates(unvalidatedColumns))
}

export function validateConfig (config: string): Config | null {
  logger.info('Validating Config')
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

    const configRepo = validateRepo(configAsObject.repo)
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

    logger.addBaseIndentation(2)

    if ('projects' in configAsObject) {
      logger.info('Found projects in config')
      logger.addBaseIndentation(2)
      typeChecker.validateObjectMember(configAsObject, 'projects', typeChecker.Type.array)

      const validatedProjects = validateProjects(configAsObject.projects)

      if (validatedProjects.length === 0) {
        throw new ReferenceError('Config does not contain any valid projects')
      }

      validatedConfig.projects = validatedProjects
    } else if ('columns' in configAsObject) {
      logger.info('Found columns in config')
      logger.addBaseIndentation(2)
      typeChecker.validateObjectMember(configAsObject, 'columns', typeChecker.Type.array)
      const validatedColumns = validateColumns(configAsObject.columns)

      if (validatedColumns.length === 0) {
        throw new ReferenceError('Config does not contain any valid columns')
      }

      validatedConfig.columns = validatedColumns
    } else {
      logger.addBaseIndentation(-4)
      throw new ReferenceError('Missing keys "projects" and "columns". One is required')
    }

    logger.addBaseIndentation(-4)

    logger.info('Validated Config:')
    logger.info(JSON.stringify(validatedConfig, null, 2))

    return validatedConfig
  } catch (error) {
    logger.addBaseIndentation(-4)

    logger.error('Failed to validate config')
    logger.tryErrorLogErrorObject(error, 2)

    return null
  }
}

function validateLabelingRule (object: any): LabelingRule {
  if (!typeChecker.isObject(object)) {
    throw new TypeError('Labeling rule must be an object')
  }

  typeChecker.validateObjectMember(object, 'action', typeChecker.Type.string)

  const formattedAction = object.action.toUpperCase().trim()

  if (!isLabelingAction(formattedAction)) {
    throw new RangeError(`Labeling action "${formattedAction}" is not supported. Supported actions are: ${JSON.stringify(Object.keys(LabelingAction))}`)
  }

  typeChecker.validateObjectMember(object, 'labels', typeChecker.Type.array)

  return {
    action: formattedAction,
    labels: validateLabels(object.labels)
  }
}

function validateLabelingRules (arr: any[]): LabelingRule[] {
  const validatedLabelingRules: LabelingRule[] = []

  arr.forEach((labelingRule: any, index: number) => {
    logger.info(`Checking labeling rule at index ${index}`)
    logger.addBaseIndentation(2)

    try {
      const validatedLabelingRule = validateLabelingRule(labelingRule)

      if (validatedLabelingRule.labels.length !== 0) {
        validatedLabelingRules.push(validatedLabelingRule)
      } else {
        logger.warn(`Labeling rule at index: ${index} did not contain any valid labels. Skipping rule.`)
      }
    } catch (error) {
      logger.warn(`Could not make valid labeling rule from value at index: ${index}. Skipping rule.`)
      logger.tryWarnLogErrorObject(error, 2)
    }

    logger.addBaseIndentation(-2)
  })

  return validatedLabelingRules
}

function validateLabels (arr: any[]): string[] {
  const validatedLabels: string[] = []

  arr.forEach((label: any, index: number) => {
    if (!(typeChecker.isString(label))) {
      logger.warn(`Label at index: ${index} was found not to be a string. Removing value.`)
    } else {
      const trimmedLabel = label.trim()

      if (trimmedLabel.length !== 0) {
        validatedLabels.push(trimmedLabel)
      } else {
        logger.warn(`Label at index: ${index} must contain at least one non whitespace character. Removing value.`)
      }
    }
  })

  return validatedLabels
}

function validateProjects (unvalidatedProjects: any[]): Project[] {
  return validateChildrenOfProjects(filterShallowInvalidProjectsAndGroupDuplicates(unvalidatedProjects))
}

function validateRepo (unvalidatedRepo: {
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
