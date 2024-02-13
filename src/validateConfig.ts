import * as githubActionsPrettyPrintLogger from './logger'
import { ColumnConfiguration, LabelingAction, LabelingRule } from './LabelerConfig'
import * as typeChecker from './typeChecker'

const indentation = '  '

function aggregateLabelsByAction (rules: LabelingRule[]): LabelingRule[] {
  const aggregatedRules: Map<LabelingAction, string[]> = new Map()

  for(const rule of rules) {
    const {action} = rule
    if (aggregatedRules.has(action)) {
      aggregatedRules.get(action)!.push(...rule.labels)
    } else {
      aggregatedRules.set(action, [...rule.labels]) 
    }
  }

  const aggregatedLabelingRules: LabelingRule[] = []

  for (const [action, labels] of aggregatedRules) {
    aggregatedLabelingRules.push({
      action: action,
      labels: labels
    })
  }

  return aggregatedLabelingRules
}

function determineLabelingRules (rules: LabelingRule[]): LabelingRule[] {
  const lastSetRuleIndex = rules.findLastIndex((rule) => rule.action === LabelingAction.SET)
  let determinedLabelingRules

  if (lastSetRuleIndex >= 0) {
    githubActionsPrettyPrintLogger.info(`Found SET labeling rule at index: ${lastSetRuleIndex}`, indentation.repeat(2))
    githubActionsPrettyPrintLogger.info('The column will be using only this rule', indentation.repeat(2))

    determinedLabelingRules = [rules[lastSetRuleIndex]]
  } else {
    githubActionsPrettyPrintLogger.info('Labeling rules list only contains ADD or REMOVE rules', indentation.repeat(2))
    githubActionsPrettyPrintLogger.info('Aggregating lables by action', indentation.repeat(2))

    determinedLabelingRules = aggregateLabelsByAction(rules)
  }

  for (const rule of determinedLabelingRules) {
    const labelsWithoutDuplicates = filterOutCaseInsensitiveDuplicates(rule.labels)

    if (labelsWithoutDuplicates.length < rule.labels.length) {
      githubActionsPrettyPrintLogger.info(`Labels for action ${rule.action} were found to have duplicate labels`, indentation.repeat(3))
      githubActionsPrettyPrintLogger.info('Removed duplicate labels', indentation.repeat(3))
      rule.labels = labelsWithoutDuplicates
    }
  }

  return determinedLabelingRules
}

function filterOutCaseInsensitiveDuplicates (arr: string[]): string[] {
  const sortedArray = arr.toSorted((str1, str2) => str1.localeCompare(str2, undefined, {sensitivity: 'base'}))

  for (let i = 0; i < sortedArray.length - 1; i++) {
    const currentElement = sortedArray[i]

    if (currentElement.toUpperCase() === sortedArray[i + 1].toUpperCase()) {
      sortedArray.splice(i + 1, 1)
    }
  }

  return sortedArray
}

function isLabelingAction (str: string): str is LabelingAction {
  return Object.keys(LabelingAction).includes(str)
}

function validateColumnConfigurationsArray (arr: any[]): ColumnConfiguration[] {
  const validatedColumnConfigurations: ColumnConfiguration[] = []

  arr.forEach((columnConfiguration: any, index: number) => {
    githubActionsPrettyPrintLogger.info(`Checking column at index ${index}`, indentation)
    let validatedColumnConfiguration

    try {
      validatedColumnConfiguration = validateColumnConfiguration(columnConfiguration)

      if (validatedColumnConfiguration.labelingRules.length) {
        validatedColumnConfigurations.push(validatedColumnConfiguration)
      } else {
        githubActionsPrettyPrintLogger.warn(`Column configuration at index: ${index} did not contain any valid labeling rules. Skipping column.`, indentation.repeat(2))
      }
    } catch (error) {
      githubActionsPrettyPrintLogger.warn(`Could not make valid column configuration from value at index: ${index}. Skipping column.`, indentation.repeat(2))

      if (error instanceof Error && error.message) {
        githubActionsPrettyPrintLogger.error(error.message, indentation.repeat(3))
      }
    }
  })

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

export default function validateConfig (config: string): ColumnConfiguration[] {
  if (config === '') {
    throw new ReferenceError('Missing required input "column_label_config"')
  }

  try {
    config = JSON.parse(config)
  } catch (error) {
    throw new SyntaxError('Could not parse input "column_label_config" as JSON')
  }

  if (!(Array.isArray(config))) {
    throw new TypeError('input "column_label_config" must be an array')
  }

  return validateColumnConfigurationsArray(config)
}

function validateLabelingRulesArray (arr: any[]): LabelingRule[] {
  const validatedLabelingRules: LabelingRule[] = []
  
  arr.forEach((labelingRule: any, index: number) => {
    githubActionsPrettyPrintLogger.info(`Checking labeling rule at index ${index}`, indentation.repeat(2))
    let validatedLabelingRule

    try {
      validatedLabelingRule = validateLabelingRule(labelingRule)

      if (validatedLabelingRule.labels.length) {
        validatedLabelingRules.push(validatedLabelingRule)
      } else {
        githubActionsPrettyPrintLogger.warn(`Labeling rule at index: ${index} did not contain any valid labels. Skipping rule.`, indentation.repeat(3))
      }
    } catch (error) {
      githubActionsPrettyPrintLogger.warn(`Could not make valid labeling rule from value at index: ${index}`, indentation.repeat(3))

      if (error instanceof Error && error.message) {
        githubActionsPrettyPrintLogger.error(error.message, indentation.repeat(4))
      }
    }
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
      githubActionsPrettyPrintLogger.warn(`Label at index: ${index} was found not to be a string. Removing value.`, indentation.repeat(3))
    } else {
      const labelWithoutSurroundingWhitespace = label.trim()

      if (!(labelWithoutSurroundingWhitespace.length)) {
        githubActionsPrettyPrintLogger.warn(`Label at index: ${index} must contain at least one non whitespace character. Removing value.`, indentation.repeat(3))
      } else {
        validatedLabels.push(labelWithoutSurroundingWhitespace)
      }
    }
  })
  
  return validatedLabels
}