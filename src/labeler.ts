const core = require('@actions/core')
const github = require('@actions/github')
const LoggerClass = require('./logger')
const logger = new LoggerClass('main')
const typeChecker = require('./typeChecker')
let columns_label_config: string = core.getInput('column_label_config')
const token = core.getInput('token')
// Javascript destructuring assignment
const {owner, repo} = github.context.repo
const octokit = github.getOctokit(token)

interface ColumnConfiguration {
  columnName: string,
  labelingRules: LabelingRule[]
}

enum LabelingAction {
  ADD = "ADD",
  REMOVE = "REMOVE",
  SET = "SET"
}

interface LabelingRule {
  action: LabelingAction,
  labels: string[]
}

function isLabelingAction (str: string): str is LabelingAction {
  return Object.keys(LabelingAction).includes(str)
}

function formatLabelingRule (unFormattedRule: any): void {
  unFormattedRule.action = unFormattedRule.action.toUpperCase() as LabelingAction
}

function getValidatedColumnConfiguration (object: any): ColumnConfiguration {
  if (!typeChecker.isObject(object)) {
    throw new TypeError('Column configuration must be an object')
  }

  typeChecker.validateObjectMember(object, 'columnName', typeChecker.types.string)

  if (!object['columnName'].length) {
    throw new ReferenceError('columnName cannot be empty string')
  }

  typeChecker.validateObjectMember(object, 'labelingRules', typeChecker.types.array)

  const validatedLabelingRules: LabelingRule[] = []
  
  object['labelingRules'].forEach((labelingRule: any, index: number) => {
    let validatedLabelingRule

    try {
      validatedLabelingRule = getValidatedLabelingRule(labelingRule)

      if (validatedLabelingRule.labels.length) {
        validatedLabelingRules.push(validatedLabelingRule)
      } else {
        logger.warn(`Labeling rule at index: ${index} did not contain any valid labels. Skipping rule.`)
      }
    } catch (error) {
      logger.warn(`Could not make valid labeling rule from value at index: ${index}`)
      logger.error(error)
    }
  })

  return {
    columnName: object['columnName'],
    labelingRules: validatedLabelingRules
  }
}

function getValidatedConfig (config: string): ColumnConfiguration[] {

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

  const validatedColumnConfigurations: ColumnConfiguration[] = []

  config.forEach((columnConfiguration: any, index: number) => {
    let validatedColumnConfiguration

    try {
      validatedColumnConfiguration = getValidatedColumnConfiguration(columnConfiguration)

      if (columnConfiguration.labelingRules.length) {
        validatedColumnConfigurations.push(validatedColumnConfiguration)
      } else {
        logger.warn(`Column configuration at index: ${index} did not contain any valid labeling rules. Skipping column.`)
      }
    } catch (error) {
      logger.warn(`Could not make valid column configuration from value at index: ${index}`)

      if (error instanceof Error && error.message) {
        logger.error('  ' + error.message)
      }
    }
  })

  return validatedColumnConfigurations
}

function getValidatedLabelingRule (object: any): LabelingRule {
  logger.info('getValidatedLabelingRule stack', new Error().stack)
  if (!typeChecker.isObject(object)) {
    throw new TypeError('Labeling rule must be an object')
  }

  typeChecker.validateObjectMember(object, 'action', typeChecker.types.string)

  const formattedAction = object['action'].toUpperCase()

  if (!isLabelingAction(formattedAction)) {
    throw new RangeError(`Labeling action "${formattedAction}" is not supported.\n Please select from the following: ${JSON.stringify(Object.keys(LabelingAction))}`)
  }

  typeChecker.validateObjectMember(object, 'labels', typeChecker.types.array)

  const validatedLabels = object['labels'].filter((label: any, index: number) => {
    const isLabelAString = typeChecker.isString(label)

    if (!isLabelAString) {
      logger.warn(`Value at index: ${index} of label array was found not to be a string. Removing value from list.`)
    }

    return isLabelAString
  })

  return {
    action: formattedAction,
    labels: validatedLabels
  }
}

function main() {
  try {
    logger.info('Validating Config')
    const validColumnConfigurations = getValidatedConfig(columns_label_config)

    if (!(validColumnConfigurations.length)) {
      logger.error('Could not find any valid actions to perform from the configuration')
      process.exitCode = 1
      return
    }

    logger.info('validatedConfig:')
    logger.info(JSON.stringify(validColumnConfigurations, null, 2))
  } catch (error) {
    if (error instanceof Error && error.message) {
      logger.error(error.message)
      process.exitCode = 1
    }
  }
}

module.exports = main