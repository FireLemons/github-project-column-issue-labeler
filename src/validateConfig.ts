import { Logger } from './logger'
import { Column, Config, LabelingAction, LabelingRule, Project } from './configObjects'
import * as typeChecker from './typeChecker'
import { caseInsensitiveCompare, caseInsensitiveAlphabetization, removeCaseInsensitiveDuplicatesFromSortedArray } from './util'

const logger = new Logger()

function getUniqueLabelsByAction (rules: LabelingRule[]): LabelingRule[] {
  const consolidatedLabels: Map<LabelingAction, string[]> = new Map()

  for(const rule of rules) {
    const {action} = rule
    if (consolidatedLabels.has(action)) {
      consolidatedLabels.get(action)!.push(...rule.labels)
    } else {
      consolidatedLabels.set(action, [...rule.labels])
    }
  }

  const consolidatedLabelingRules: LabelingRule[] = []

  for (const [action, labels] of consolidatedLabels) {
    consolidatedLabelingRules.push({
      action: action,
      labels: labels
    })
  }

  return consolidatedLabelingRules
}

function determineLabelingRules (rules: LabelingRule[]): LabelingRule[] {
  const lastSetRuleIndex = rules.findLastIndex((rule) => rule.action === LabelingAction.SET)
  let determinedLabelingRules

  if (lastSetRuleIndex >= 0) {
    logger.info(`Found SET labeling rule at index: ${lastSetRuleIndex}`)
    logger.info('The column will be using only this rule', 2)

    determinedLabelingRules = [rules[lastSetRuleIndex]]
  } else {
    logger.info('Labeling rules list only contains ADD or REMOVE rules. All rules will be used.')

    if (rules.length > 2 || (rules.length === 2 && rules[0].action === rules[1].action) ) {
      logger.info('Filtering duplicate lables by action')
      determinedLabelingRules = getUniqueLabelsByAction(rules)
    } else {
      determinedLabelingRules = rules
    }
  }

  for (const rule of determinedLabelingRules) {
    const labelsWithoutDuplicates = removeCaseInsensitiveDuplicatesFromSortedArray(caseInsensitiveAlphabetization(rule.labels))

    if (labelsWithoutDuplicates.length < rule.labels.length) {
      logger.warn(`Labels for action ${rule.action} were found to have duplicate labels. Removed duplicate labels.`)
      rule.labels = labelsWithoutDuplicates
    }
  }

  const addRule = determinedLabelingRules.find((labelingRule) => {return labelingRule.action === LabelingAction.ADD})
  const removeRule = determinedLabelingRules.find((labelingRule) => {return labelingRule.action === LabelingAction.REMOVE})

  if (addRule && removeRule) {
    removeMatchingCaseInsensitiveStringsBetweenArrays(addRule.labels, removeRule.labels)
  }

  return determinedLabelingRules
}

function removeMatchingCaseInsensitiveStringsBetweenArrays (sortedArray1: string[], sortedArray2: string[]) {
  let cursor1 = 0,
  cursor2 = 0

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

function isLabelingAction (str: string): str is LabelingAction {
  return Object.keys(LabelingAction).includes(str)
}

function validateColumnsArray (arr: any[]): Column[] {
  const columnMap: {
    [key: string]: any[]
  } = {}

  logger.addBaseIndentation(2)
  logger.info(`Validating items in column array and handling possible duplicates`)

  arr.forEach((column: any, index: number) => {
    logger.addBaseIndentation(2)
    logger.info(`Validating column at index ${index}`)
    logger.addBaseIndentation(2)

    try {
      const validatedColumn = validateColumn(column)

      const columnName = validatedColumn.name

      if (columnName in columnMap) {
        columnMap[validatedColumn.name].push(...validatedColumn.labelingRules)
        logger.warn(`Found multiple columns with name:"${columnName}". Combining labeling rule lists.`)
      } else {
        columnMap[validatedColumn.name] = validatedColumn.labelingRules
      }
    } catch (error) {
      logger.warn(`Could not make valid column configuration from value at index: ${index}. Skipping column.`)

      if (error instanceof Error) {
        logger.error(error.stack ?? error.message, 2)
      }
    }

    logger.addBaseIndentation(-4)
  })

  logger.info(`Validating labeling rules for valid columns`)
  const validatedColumns: Column[] = []

  for (let columnName in columnMap) {
    logger.addBaseIndentation(2)
    logger.info(`Validating labeling rules of column with name:"${columnName}"`)

    logger.addBaseIndentation(2)
    const validatedLabelingRules = determineLabelingRules(validateLabelingRulesArray(columnMap[columnName]))

    if (!validatedLabelingRules.length) {
      logger.warn(`Column with name:"${columnName}" did not contain any valid labeling rules. Skipping column.`, 2)
    } else {
      validatedColumns.push({
        labelingRules: validatedLabelingRules,
        name: columnName
      })
    }

    logger.addBaseIndentation(-4)
  }

  logger.addBaseIndentation(-2)

  return validatedColumns
}

function validateColumn (object: any): Column {
  if (!typeChecker.isObject(object)) {
    throw new TypeError('Column configuration must be an object')
  }

  typeChecker.validateObjectMember(object, 'name', typeChecker.Type.string)

  const validatedName = object['name'].trim()

  if (!(validatedName.length)) {
    throw new ReferenceError('name must contain at least one non whitespace character')
  }

  typeChecker.validateObjectMember(object, 'labelingRules', typeChecker.Type.array)

  return {
    name: validatedName,
    labelingRules: object['labelingRules']
  }
}

export function validateConfig (config: string): Config {
  let configAsObject

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

  const configRepo = configAsObject['repo']

  typeChecker.validateObjectMember(configRepo, 'name', typeChecker.Type.string)
  typeChecker.validateObjectMember(configRepo, 'ownerName', typeChecker.Type.string)

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

  if ('projects' in configAsObject) {
    logger.info('Found projects in config')
    typeChecker.validateObjectMember(configAsObject, 'projects', typeChecker.Type.array)
    validatedConfig['projects'] = validateProjectsArray(configAsObject.projects)
  } else if('columns' in configAsObject) {
    logger.info('Found columns in config')
    typeChecker.validateObjectMember(configAsObject, 'columns', typeChecker.Type.array)
    validatedConfig['columns'] = validateColumnsArray(configAsObject.columns)
  } else {
    throw new ReferenceError('Missing keys "projects" and "columns". One is required')
  }

  return validatedConfig
}

function validateLabelingRulesArray (arr: any[]): LabelingRule[] {
  const validatedLabelingRules: LabelingRule[] = []

  arr.forEach((labelingRule: any, index: number) => {
    logger.info(`Checking labeling rule at index ${index}`)
    let validatedLabelingRule

    logger.addBaseIndentation(2)

    try {
      validatedLabelingRule = validateLabelingRule(labelingRule)

      if (validatedLabelingRule.labels.length) {
        validatedLabelingRules.push(validatedLabelingRule)
      } else {
        logger.warn(`Labeling rule at index: ${index} did not contain any valid labels. Skipping rule.`)
      }
    } catch (error) {
      logger.warn(`Could not make valid labeling rule from value at index: ${index}. Skipping rule.`)

      if (error instanceof Error) {
        logger.error(error.stack ?? error.message, 2)
      }
    }

    logger.addBaseIndentation(-2)
  })

  return validatedLabelingRules
}

function validateLabelingRule (object: any): LabelingRule {
  if (!typeChecker.isObject(object)) {
    throw new TypeError('Labeling rule must be an object')
  }

  typeChecker.validateObjectMember(object, 'action', typeChecker.Type.string)

  const formattedAction = object['action'].toUpperCase().trim()

  if (!isLabelingAction(formattedAction)) {
    throw new RangeError(`Labeling action "${formattedAction}" is not supported. Supported actions are: ${JSON.stringify(Object.keys(LabelingAction))}`)
  }

  typeChecker.validateObjectMember(object, 'labels', typeChecker.Type.array)

  return {
    action: formattedAction,
    labels: validateLabelsArray(object['labels'])
  }
}

function validateLabelsArray (arr: any[]): string[] {
  const validatedLabels: string[] = []

  arr.forEach((label: any, index: number) => {
    if (!(typeChecker.isString(label))) {
      logger.warn(`Label at index: ${index} was found not to be a string. Removing value.`)
    } else {
      const labelWithoutSurroundingWhitespace = label.trim()

      if (!(labelWithoutSurroundingWhitespace.length)) {
        logger.warn(`Label at index: ${index} must contain at least one non whitespace character. Removing value.`)
      } else {
        validatedLabels.push(labelWithoutSurroundingWhitespace)
      }
    }
  })

  return validatedLabels
}

function validateProjectsArray (arr: any[]): Project[] {
  const validatedProjects: Project[] = []

  logger.addBaseIndentation(2)

  arr.forEach((project: any, index: number) => {
    logger.info(`Checking project at index ${index}`)
    let validatedProject

    logger.addBaseIndentation(2)

    try {
      validatedProject = validateProject(project)

      if (validatedProject.columns.length) {
        validatedProjects.push(validatedProject)
      } else {
        logger.warn(`Project at index: ${index} did not contain any valid columns. Skipping project.`)
      }
    } catch (error) {
      logger.warn(`Could not make valid project from value at index: ${index}. Skipping project.`)

      if (error instanceof Error) {
        logger.error(error.stack ?? error.message, 2)
      }
    }

    logger.addBaseIndentation(-2)
  })

  function validateProject (object: any): Project {
    if (!typeChecker.isObject(object)) {
      throw new TypeError('Project must be an object')
    }

    typeChecker.validateObjectMember(object, 'ownerLogin', typeChecker.Type.string)

    if ('number' in object) {
      typeChecker.validateObjectMember(object, 'number', typeChecker.Type.number)
    }

    if (object['number'] < 1) {
      throw new RangeError('number must be greater than 0')
    }

    const validatedOwnerLogin = object['ownerLogin'].trim()

    if (!(validatedOwnerLogin.length)) {
      throw new ReferenceError('ownerLogin must contain at least one non whitespace character')
    }

    typeChecker.validateObjectMember(object, 'columns', typeChecker.Type.array)

    const validatedProjects = validateColumnsArray(object['columns'])

    return {
      columns: validatedProjects,
      number: object['number'],
      ownerLogin: validatedOwnerLogin
    }
  }

  logger.addBaseIndentation(-2)

  return validatedProjects
}
