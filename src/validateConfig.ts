import { Logger } from './logger'
import { ColumnConfiguration, Config, LabelingAction, LabelingRule } from './LabelerConfig'
import * as typeChecker from './typeChecker'

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
    logger.info('Labeling rules list only contains ADD or REMOVE rules')

    if (rules.length > 2 || (rules.length === 2 && rules[0].action === rules[1].action) ) {
      logger.info('Filtering duplicate lables by action')
      determinedLabelingRules = getUniqueLabelsByAction(rules)
    } else {
      determinedLabelingRules = rules
    }
  }

  logger.addBaseIndentation(2)

  for (const rule of determinedLabelingRules) {
    const labelsWithoutDuplicates = removeCaseInsensitiveDuplicates(sortLabels(rule.labels))

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

  logger.addBaseIndentation(-2)

  return determinedLabelingRules
}

function caseInsensitiveCompare (str1: string, str2: string): number{
  return str1.localeCompare(str2, undefined, {sensitivity: 'base'})
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
      logger.warn(`Found same label: "${sortedArray1[cursor1]}" in both ADD and REMOVE labeling rules. Removing label.`, 2)
      sortedArray1.splice(cursor1, 1)
      sortedArray2.splice(cursor2, 1)
    }
  }
}

function removeCaseInsensitiveDuplicates (sortedArray: string[]): string[] {
  let i = 0
  while(i < sortedArray.length - 1) {
    if (!caseInsensitiveCompare(sortedArray[i], sortedArray[i + 1])) {
      sortedArray.splice(i + 1, 1)
    } else {
      i++
    }
  }

  return sortedArray
}

function isLabelingAction (str: string): str is LabelingAction {
  return Object.keys(LabelingAction).includes(str)
}

function sortLabels(arr: string[]): string[] {
  return arr.toSorted(caseInsensitiveCompare)
}

function validateColumnConfigurationsArray (arr: any[]): ColumnConfiguration[] {
  const validatedColumnConfigurations: ColumnConfiguration[] = []

  logger.addBaseIndentation(2)

  arr.forEach((columnConfiguration: any, index: number) => {
    logger.info(`Checking column at index ${index}`)
    let validatedColumnConfiguration

    logger.addBaseIndentation(2)

    try {
      validatedColumnConfiguration = validateColumnConfiguration(columnConfiguration)

      if (validatedColumnConfiguration.labelingRules.length) {
        validatedColumnConfigurations.push(validatedColumnConfiguration)
      } else {
        logger.warn(`Column configuration at index: ${index} did not contain any valid labeling rules. Skipping column.`)
      }
    } catch (error) {
      logger.warn(`Could not make valid column configuration from value at index: ${index}. Skipping column.`)

      if (error instanceof Error && error.message) {
        logger.error(error.message, 2)
      }
    }

    logger.addBaseIndentation(-2)
  })

  logger.addBaseIndentation(-2)

  return validatedColumnConfigurations
}

function validateColumnConfiguration (object: any): ColumnConfiguration {
  if (!typeChecker.isObject(object)) {
    throw new TypeError('Column configuration must be an object')
  }

  typeChecker.validateObjectMember(object, 'columnName', typeChecker.Type.string)

  const validatedColumnName = object['columnName'].trim()

  if (!(validatedColumnName.length)) {
    throw new ReferenceError('columnName must contain at least one non whitespace character')
  }

  typeChecker.validateObjectMember(object, 'labelingRules', typeChecker.Type.array)
  
  const validatedLabelingRules = validateLabelingRulesArray(object['labelingRules'])

  return {
    columnName: validatedColumnName,
    labelingRules: determineLabelingRules(validatedLabelingRules)
  }
}

export default function validateConfig (config: string): Config {
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
  typeChecker.validateObjectMember(configAsObject, 'owner', typeChecker.Type.string)
  typeChecker.validateObjectMember(configAsObject, 'repo', typeChecker.Type.string)
  typeChecker.validateObjectMember(configAsObject, 'columnLabelConfig', typeChecker.Type.array)

  const trimmedGithubAccessToken = configAsObject.accessToken.trim()

  if (!(trimmedGithubAccessToken.length)) {
    throw new RangeError('The github access token cannot be empty or contain only whitespace')
  }

  return {
    accessToken: trimmedGithubAccessToken,
    owner: configAsObject['owner'].trim(),
    repo: configAsObject['repo'].trim(),
    columnLabelConfig: validateColumnConfigurationsArray(configAsObject.columnLabelConfig)
  }
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

      if (error instanceof Error && error.message) {
        logger.error(error.message, 2)
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