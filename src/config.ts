import { ProjectPrimaryKeyHumanReadable } from './githubObjects'
import { Logger } from './logger'
import * as TypeChecker from './typeChecker'
import { caseInsensitiveCompare, caseInsensitiveAlphabetization, nestedMapsToObject, removeCaseInsensitiveDuplicatesFromSortedArray, GenericObjectWithStringKeys, firstKeyValuePairOfMap } from './util'

export enum LabelingAction {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  SET = 'SET'
}

export interface ColumnAsArrayItem {
  name: string
  labelingActions: LabelingActionAsArrayItem[]
}

export interface LabelingActionAsArrayItem {
  action: LabelingAction
  labels: string[]
}

export interface ProjectAsArrayItem {
  columns: ColumnAsArrayItem[]
  projectKey: ProjectPrimaryKeyHumanReadable
}

interface ShallowValidatedColumn {
  name: string
  labelingActions: any[]
}

interface ShallowValidatedProject {
  columns: any[]
  projectKey: ProjectPrimaryKeyHumanReadable
}

export type LabelingActionsAsMap = Map<LabelingAction, string[]>
export type LabelingRuleContainer = ColumnnLabelingRuleContainer | ProjectLabelingRuleContainer
export type ColumnnLabelingRuleContainer = Map<string, LabelingActionsAsMap>
export type ProjectLabelingRuleContainer = Map<string, Map<number, ColumnnLabelingRuleContainer>>

export class Config {
  #githubAPIToken: string
  #isProjectMode: boolean
  #labelingRuleContainer: LabelingRuleContainer
  #logger: Logger
  #repo: {
    name: string
    ownerName: string
  }

  constructor (configPOJOString: string, logger: Logger) {
    this.#logger = logger

    this.#logger.info('Validating Config')
    this.#logger.addBaseIndentation(2)

    try {
      const configPOJO = this.#parseConfig(configPOJOString)

      if (!(TypeChecker.isObject(configPOJO))) {
        throw new TypeError('The config must be an object')
      }

      this.#githubAPIToken = this.#validateAccessToken(configPOJO)
      this.#repo = this.#validateRepo(configPOJO)

      let labelingRuleContainerPOJO

      if ('projects' in configPOJO) {
        this.#logger.info('Found projects in config')

        this.#isProjectMode = true
        TypeChecker.validateObjectMember(configPOJO, 'projects', TypeChecker.Type.array)

        labelingRuleContainerPOJO = configPOJO.projects
      } else if ('columns' in configPOJO) {
        this.#logger.info('Found columns in config')

        this.#isProjectMode = false
        TypeChecker.validateObjectMember(configPOJO, 'columns', TypeChecker.Type.array)

        labelingRuleContainerPOJO = configPOJO.columns
      } else {
        throw new ReferenceError('Missing keys "projects" and "columns". One is required')
      }

      this.#labelingRuleContainer = this.#validateLabelingRuleContainer(labelingRuleContainerPOJO)
      this.#logger.addBaseIndentation(-2)

      //logger.info('Validated Config:')
      //this.#logger.info(this.toString(true))
    } catch (error) {
      this.#logger.addBaseIndentation(-2)
      throw error
      /*this.logger.addBaseIndentation(-4)

      this.logger.error('Failed to validate config')
      this.logger.tryErrorLogErrorObject(error, 2)

      return null*/
    }
  }

  getAPIToken () {
    return this.#githubAPIToken
  }

  getRepoName () {
    return this.#repo.name
  }

  getRepoOwnerName () {
    return this.#repo.ownerName
  }

  getLabelingRules () {
    return this.#labelingRuleContainer
  }

  isProjectMode (): boolean {
    return this.#isProjectMode
  }

  toString (prettyPrint?: boolean): string {
    const configAsPOJO = {
      accessToken: this.#githubAPIToken,
      labelingActions: nestedMapsToObject(this.#labelingRuleContainer),
      repo: this.#repo
    }

    if (prettyPrint) {
      return JSON.stringify(configAsPOJO, null, 2)
    } else {
      return JSON.stringify(configAsPOJO)
    }
  }

  #columnArrayToMap (columns: ColumnAsArrayItem[]): ColumnnLabelingRuleContainer {
    const columnsAsMap: ColumnnLabelingRuleContainer = new Map()

    for (const column of columns) {
      const name = column.name.toLocaleLowerCase()
      const labelingActions = this.#labelingActionArrayToMap(column.labelingActions)
      const labelingActionCollision = columnsAsMap.get(name)

      if (labelingActionCollision !== undefined) {
        this.#logger.warn(`Found duplicate column with name: "${name}". Merging labeling actions.`)
        columnsAsMap.set(name, this.#mergeLabelingActions(labelingActions, labelingActionCollision))
      } else {
        columnsAsMap.set(name, labelingActions)
      }
    }

    return columnsAsMap
  }

  #determineLabelingActions (rules: LabelingActionsAsMap): void {
    if (rules.has(LabelingAction.SET)) {
      if (rules.has(LabelingAction.ADD)) {
        rules.delete(LabelingAction.ADD)
      }

      if (rules.has(LabelingAction.REMOVE)) {
        rules.delete(LabelingAction.REMOVE)
      }
    }
  }

  #hasAddAndRemoveRule (labelingActionMap: LabelingActionsAsMap) {
    return labelingActionMap.has(LabelingAction.ADD) && labelingActionMap.has(LabelingAction.REMOVE)
  }

  #isLabelingAction (str: string): str is LabelingAction {
    return Object.keys(LabelingAction).includes(str)
  }

  #labelingActionArrayToMap (labelingActions: LabelingActionAsArrayItem[]): LabelingActionsAsMap {
    const labelingActionsAsMap: LabelingActionsAsMap = new Map()

    for (const labelingAction of labelingActions) {
      const { action, labels } = labelingAction
      const labelsCollision = labelingActionsAsMap.get(action)

      if (labelsCollision === undefined) {
        labelingActionsAsMap.set(action, labels)
      } else {
        labelsCollision.push(...labels)
      }
    }

    return labelingActionsAsMap
  }

  #labelingRuleArrayContainerToMap (validatedLabelingRuleArrayContainer: ColumnAsArrayItem[] | ProjectAsArrayItem[]): LabelingRuleContainer {
    const sampleLabelingRuleContainer = validatedLabelingRuleArrayContainer[0]

    if ('projectKey' in sampleLabelingRuleContainer) {
      return this.#projectArrayToMap(validatedLabelingRuleArrayContainer as ProjectAsArrayItem[])
    } else {
      return this.#columnArrayToMap(validatedLabelingRuleArrayContainer as ColumnAsArrayItem[])
    }
  }

  #mergeColumnContainers (columnsHigherPrecedence: ColumnnLabelingRuleContainer, columnsLowerPrecedence: ColumnnLabelingRuleContainer): ColumnnLabelingRuleContainer {
    const mergedColumnContainers = structuredClone(columnsLowerPrecedence)

    for (const [lowerCaseColumnName, labelingActions] of columnsHigherPrecedence.entries()) {
      const columnNameCollision = mergedColumnContainers.get(lowerCaseColumnName)

      if (columnNameCollision !== undefined) {
        mergedColumnContainers.set(lowerCaseColumnName, this.#mergeLabelingActions(columnNameCollision, labelingActions))
      } else {
        mergedColumnContainers.set(lowerCaseColumnName, labelingActions)
      }
    }

    return mergedColumnContainers
  }

  #mergeLabelingActions (labelingActionsHigherPrecedence: LabelingActionsAsMap, labelingActionsLowerPrecedence: LabelingActionsAsMap): LabelingActionsAsMap {
    const mergedLabelingActions = new Map(labelingActionsLowerPrecedence)

    const higherPrecedenceAddLabels = labelingActionsHigherPrecedence.get(LabelingAction.ADD)

    if (higherPrecedenceAddLabels !== undefined) {
      if (mergedLabelingActions.has(LabelingAction.ADD)) {
        this.#logger.warn('Found duplicate labeling action: ADD. Concatenating labels.')
        mergedLabelingActions.get(LabelingAction.ADD)!.push(...higherPrecedenceAddLabels)
      } else {
        mergedLabelingActions.set(LabelingAction.ADD, higherPrecedenceAddLabels)
      }
    }

    const higherPrecedenceRemoveLabels = labelingActionsHigherPrecedence.get(LabelingAction.REMOVE)

    if (higherPrecedenceRemoveLabels !== undefined) {
      if (mergedLabelingActions.has(LabelingAction.REMOVE)) {
        this.#logger.warn('Found duplicate labeling action: REMOVE. Concatenating labels.')
        mergedLabelingActions.get(LabelingAction.REMOVE)!.push(...higherPrecedenceRemoveLabels)
      } else {
        mergedLabelingActions.set(LabelingAction.REMOVE, higherPrecedenceRemoveLabels)
      }
    }

    if (labelingActionsHigherPrecedence.has(LabelingAction.SET)) {
      const higherPrecedenceLabels = labelingActionsHigherPrecedence.get(LabelingAction.SET)!
      this.#logger.warn(`Found duplicate labeling action: SET. Selecting labels: [${higherPrecedenceLabels}] because it appears lower in the config.`)
      mergedLabelingActions.set(LabelingAction.SET, higherPrecedenceLabels)
    }

    return mergedLabelingActions
  }

  #parseConfig (configPOJOAsString: string) {
    try {
      return JSON.parse(configPOJOAsString)
    } catch (error) {
      throw new SyntaxError('Could not parse config as JSON')
    }
  }

  #projectArrayToMap (projects: ProjectAsArrayItem[]): ProjectLabelingRuleContainer {
    const projectsAsMap: ProjectLabelingRuleContainer = new Map()

    for (const project of projects) {
      const columns = this.#columnArrayToMap(project.columns)
      const projectKey = project.projectKey
      const projectOwnerName = projectKey.getName().toLocaleLowerCase()
      const projectNumber = projectKey.getNumber()
      const projectOwnerNameCollision = projectsAsMap.get(projectOwnerName)

      if (projectOwnerNameCollision !== undefined) {
        const projectNumberCollision = projectOwnerNameCollision.get(projectNumber)

        if (projectNumberCollision !== undefined) {
          this.#logger.warn(`Found duplicate project with owner name: "${projectOwnerName}" and number: ${projectNumber}. Merging child columns.`)
          projectOwnerNameCollision.set(projectNumber, this.#mergeColumnContainers(columns, projectNumberCollision))
        } else {
          projectOwnerNameCollision.set(projectNumber, columns)
        }
      } else {
        projectsAsMap.set(projectOwnerName, new Map([[projectNumber, columns]]))
      }
    }

    return projectsAsMap
  }

  #pruneConflictsAndSortLabels (labelingRules: LabelingRuleContainer): void {
    if (this.#isProjectMode) {
      this.#pruneConflictsAndSortLabelsFromProjectLabelingRuleContainer(labelingRules as ProjectLabelingRuleContainer)
    } else {
      this.#pruneConflictsAndSortLabelsFromColumnLabelingRuleContainer(labelingRules as ColumnnLabelingRuleContainer)
    }
  }

  #pruneConflictsAndSortLabelsFromColumnLabelingRuleContainer (labelingRules: ColumnnLabelingRuleContainer) {
    for (const [columnName, labelingActionMap] of labelingRules) {
      this.#determineLabelingActions(labelingActionMap)

      for (const [labelingAction, labels] of labelingActionMap) {
        labelingActionMap.set(labelingAction, caseInsensitiveAlphabetization(labels))
      }

      if (this.#hasAddAndRemoveRule(labelingActionMap)) {
        this.#removeCaseInsensitiveDuplicateLabelsBetweenArrays(labelingActionMap.get(LabelingAction.ADD)!, labelingActionMap.get(LabelingAction.REMOVE)!)

        for (const [labelingAction, labels] of labelingActionMap) {
          if (labels.length === 0) {
            this.#logger.warn(`Labeling action:"${labelingAction}" from column with name:"${columnName}" did not contain any valid labels. Removing action.`)
            labelingActionMap.delete(labelingAction)
          }
        }

        if (labelingActionMap.size === 0) {
          this.#logger.warn(`Column with name:"${columnName}" did not contain any valid labeling actions. Removing column.`)
          labelingRules.delete(columnName)
        }
      } else {
        for (const [labelingAction, labels] of labelingActionMap) {
          labelingActionMap.set(labelingAction, removeCaseInsensitiveDuplicatesFromSortedArray(labels))
        }
      }
    }
  }

  #pruneConflictsAndSortLabelsFromProjectLabelingRuleContainer (labelingRules: ProjectLabelingRuleContainer) {
    for (const [projectOwnerName, projectNumberMap] of labelingRules) {
      for (const [projectNumber, columnNameMap] of projectNumberMap) {
        this.#pruneConflictsAndSortLabelsFromColumnLabelingRuleContainer(columnNameMap)

        if (columnNameMap.size === 0) {
          this.#logger.warn(`Project with owner name:"${projectOwnerName}" ${projectNumber === 0 ? '' : 'and number:' + projectNumber } did not contain any valid columns. Removing project.`)
          projectNumberMap.delete(projectNumber)
        }
      }

      if (projectNumberMap.size === 0) {
        labelingRules.delete(projectOwnerName)
      }
    }
  }

  /**
   * Removes duplicate strings between arrays and duplicates among each individual array
   */
  #removeCaseInsensitiveDuplicateLabelsBetweenArrays (sortedLabels1: string[], sortedLabels2: string[]) {
    const removeConsecutiveDuplicatesStartingAtIndex = (index: number, sortedLabels: string[]) => {
      let duplicateCount = 0

      if (index > 0) {
        let caseInsensitiveComparison

        do {
          caseInsensitiveComparison = caseInsensitiveCompare(sortedLabels[index], sortedLabels[index - 1])

          if (caseInsensitiveComparison === 0) {
            sortedLabels.splice(index, 1)
            duplicateCount++
            index--
          } else {
            return duplicateCount
          }
        } while (caseInsensitiveComparison === 0)
      }

      return duplicateCount
    }

    removeConsecutiveDuplicatesStartingAtIndex(sortedLabels1.length - 1, sortedLabels1)
    removeConsecutiveDuplicatesStartingAtIndex(sortedLabels2.length - 1, sortedLabels2)

    let cursor1 = sortedLabels1.length - 1
    let cursor2 = sortedLabels2.length - 1

    while (cursor1 >= 0 && cursor2 >= 0) {
      const comparison = caseInsensitiveCompare(sortedLabels1[cursor1], sortedLabels2[cursor2])

      if (comparison > 0) {
        cursor1--
        cursor1 -= removeConsecutiveDuplicatesStartingAtIndex(cursor1, sortedLabels1)
      } else if (comparison < 0) {
        cursor2--
        cursor2 -= removeConsecutiveDuplicatesStartingAtIndex(cursor2, sortedLabels2)
      } else {
        this.#logger.warn(`Found same label: "${sortedLabels1[cursor1]}" in both ADD and REMOVE labeling actions. Removing label.`)
        sortedLabels1.splice(cursor1, 1)
        sortedLabels2.splice(cursor2, 1)
        cursor1--
        cursor2--
      }
    }
  }

  #shallowValidateColumn (object: any): ShallowValidatedColumn {
    if (!TypeChecker.isObject(object)) {
      throw new TypeError('Column must be an object')
    }

    TypeChecker.validateObjectMember(object, 'name', TypeChecker.Type.string)

    const validatedName = object.name.trim()

    if (!(validatedName.length)) {
      throw new ReferenceError('name must contain at least one non whitespace character')
    }

    TypeChecker.validateObjectMember(object, 'labelingActions', TypeChecker.Type.array)

    return {
      name: validatedName,
      labelingActions: object.labelingActions
    }
  }

  #shallowValidateProject (object: any): ProjectAsArrayItem {
    if (!TypeChecker.isObject(object)) {
      throw new TypeError('A project must be an object')
    }

    TypeChecker.validateObjectMember(object, 'columns', TypeChecker.Type.array)
    TypeChecker.validateObjectMember(object, 'ownerLogin', TypeChecker.Type.string)

    const trimmedOwnerLogin = object.ownerLogin.trim()

    let validatedProject: ProjectAsArrayItem

    if ('number' in object) {
      TypeChecker.validateObjectMember(object, 'number', TypeChecker.Type.number)

      if (!(Number.isInteger(object.number))) {
        throw new TypeError('number must be an integer')
      }

      if (object.number < 1) {
        throw new RangeError('number must be greater than 0')
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

  #validateAccessToken (configPOJO: GenericObjectWithStringKeys): string {
    TypeChecker.validateObjectMember(configPOJO, 'accessToken', TypeChecker.Type.string)

    const trimmedAccessToken = configPOJO.accessToken.trim()

    if (!(trimmedAccessToken.length)) {
      throw new RangeError('The github access token cannot be empty or contain only whitespace')
    }

    return trimmedAccessToken
  }

  #validateColumn (unvalidatedColumn: any): ColumnAsArrayItem {
    const shallowValidatedColumn: ShallowValidatedColumn = this.#shallowValidateColumn(unvalidatedColumn)
    const validatedLabelingRules = this.#validateLabelingActions(shallowValidatedColumn.labelingActions)

    if (validatedLabelingRules.length !== 0) {
      shallowValidatedColumn.labelingActions = validatedLabelingRules
      return shallowValidatedColumn
    } else {
      throw new Error('Column did not contain any valid labeling actions. Skipping column.')
    }
  }

  #validateColumns (unvalidatedColumns: any[]): ColumnAsArrayItem[] {
    const validatedColumns: ColumnAsArrayItem[] = []

    unvalidatedColumns.forEach((unvalidatedColumn: any, index: number) => {
      this.#logger.info(`Validating column at index ${index}`)
      this.#logger.addBaseIndentation(2)

      try {
        validatedColumns.push(this.#validateColumn(unvalidatedColumn))
      } catch (error) {
        this.#logger.warn('Could not make valid column. Skipping column.')
        this.#logger.tryWarnLogErrorObject(error, 2)
      }

      this.#logger.addBaseIndentation(-2)
    })

    return validatedColumns
  }

  #validateLabelingAction (object: any): LabelingActionAsArrayItem {
    if (!TypeChecker.isObject(object)) {
      throw new TypeError('Labeling action must be an object')
    }

    TypeChecker.validateObjectMember(object, 'action', TypeChecker.Type.string)

    const formattedAction = object.action.toUpperCase().trim()

    if (!(this.#isLabelingAction(formattedAction))) {
      throw new RangeError(`Labeling action "${formattedAction}" is not supported. Supported actions are: ${JSON.stringify(Object.keys(LabelingAction))}`)
    }

    TypeChecker.validateObjectMember(object, 'labels', TypeChecker.Type.array)

    return {
      action: formattedAction,
      labels: this.#validateLabels(object.labels)
    }
  }

  #validateLabelingActions (unvalidatedLabelingActions: any[]): LabelingActionAsArrayItem[] {
    const validatedLabelingActions: LabelingActionAsArrayItem[] = []

    unvalidatedLabelingActions.forEach((labelingRule: any, index: number) => {
      this.#logger.info(`Validating labeling action at index ${index}`)
      this.#logger.addBaseIndentation(2)

      try {
        const validatedLabelingAction = this.#validateLabelingAction(labelingRule)

        if (validatedLabelingAction.labels.length !== 0) {
          validatedLabelingActions.push(validatedLabelingAction)
        } else {
          this.#logger.warn(`Labeling action did not contain any valid labels. Skipping action.`)
        }
      } catch (error) {
        this.#logger.warn('Could not make valid labeling action. Skipping action.')
        this.#logger.tryWarnLogErrorObject(error, 2)
      }

      this.#logger.addBaseIndentation(-2)
    })

    return validatedLabelingActions
  }

  #validateLabelingRuleContainer (containerPOJO: any[]): LabelingRuleContainer {
    this.#logger.addBaseIndentation(2)
    let validatedLabelingRuleArrayContainer

    if (this.#isProjectMode) {
      const validatedProjects = this.#validateProjects(containerPOJO)

      if (validatedProjects.length === 0) {
        throw new ReferenceError('Config does not contain any valid projects')
      }

      validatedLabelingRuleArrayContainer = validatedProjects
    } else {
      const validatedColumns = this.#validateColumns(containerPOJO)

      if (validatedColumns.length === 0) {
        throw new ReferenceError('Config does not contain any valid columns')
      }

      validatedLabelingRuleArrayContainer = validatedColumns
    }

    this.#logger.addBaseIndentation(-2)

    this.#logger.info('Resolving duplicates')
    this.#logger.addBaseIndentation(2)

    const labelingRuleContainerAsMap = this.#labelingRuleArrayContainerToMap(validatedLabelingRuleArrayContainer)

    this.#logger.addBaseIndentation(-2)

    this.#logger.info('Sorting labels')
    this.#logger.info('Resolving labeling action precedence and removing conflicting rules.')
    this.#logger.addBaseIndentation(2)

    this.#pruneConflictsAndSortLabels(labelingRuleContainerAsMap)

    this.#logger.addBaseIndentation(-2)

    if (labelingRuleContainerAsMap.size === 0) {
      throw new Error('The labeling rule container did not contain any valid rules')
    }

    return labelingRuleContainerAsMap
  }

  #validateLabels (arr: any[]): string[] {
    const validatedLabels: string[] = []

    arr.forEach((label: any, index: number) => {
      if (!(TypeChecker.isString(label))) {
        this.#logger.warn(`Label at index: ${index} was found not to be a string. Removing label.`)
      } else {
        const trimmedLabel = label.trim()

        if (trimmedLabel.length !== 0) {
          validatedLabels.push(trimmedLabel)
        } else {
          this.#logger.warn(`Label at index: ${index} must contain at least one non whitespace character. Removing label.`)
        }
      }
    })

    return validatedLabels
  }

  #validateProject (unvalidatedProject: any): ProjectAsArrayItem {
    const shallowValidatedProject: ShallowValidatedProject = this.#shallowValidateProject(unvalidatedProject)
    const validatedColumns = this.#validateColumns(shallowValidatedProject.columns)

    if (validatedColumns.length < 1) {
      throw new Error('The project did not contain any valid columns. Skipping project.')
    } else {

      shallowValidatedProject.columns = validatedColumns
      return shallowValidatedProject
    }
  }

  #validateProjects (unvalidatedProjects: any[]): ProjectAsArrayItem[] {
    const validatedProjects: ProjectAsArrayItem[] = []

    unvalidatedProjects.forEach((unvalidatedProject: any, index: number) => {
      this.#logger.info(`Validating project at index ${index}`)
      this.#logger.addBaseIndentation(2)

      try {
        validatedProjects.push(this.#validateProject(unvalidatedProject))
      } catch (error) {
        this.#logger.warn('Could not make valid project. Skipping project.')
        this.#logger.tryWarnLogErrorObject(error, 2)
      }

      this.#logger.addBaseIndentation(-2)
    })

    return validatedProjects
  }

  #validateRepo (configPOJO: GenericObjectWithStringKeys) {
    TypeChecker.validateObjectMember(configPOJO, 'repo', TypeChecker.Type.object)

    const unvalidatedRepo = configPOJO.repo

    TypeChecker.validateObjectMember(unvalidatedRepo, 'name', TypeChecker.Type.string)
    TypeChecker.validateObjectMember(unvalidatedRepo, 'ownerName', TypeChecker.Type.string)

    const trimmedName = unvalidatedRepo.name.trim()
    const trimmedOwnerName = unvalidatedRepo.ownerName.trim()

    if (!(trimmedName.length)) {
      throw new RangeError('name must contain at least one non whitespace character')
    }

    if (!(trimmedOwnerName.length)) {
      throw new RangeError('ownerName must contain at least one non whitespace character')
    }

    return {
      name: trimmedName,
      ownerName: trimmedOwnerName
    }
  }
}
