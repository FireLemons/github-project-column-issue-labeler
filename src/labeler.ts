const core = require('@actions/core')
const github = require('@actions/github')
const typeChecker = require('./typeChecker')
let columns_label_config = core.getInput('column_label_config')
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

interface WorkflowConfiguraton {
  columnConfigurations: ColumnConfiguration[]
}

function isLabelingAction (str: string): str is LabelingAction {
  return Object.keys(LabelingAction).includes(str)
}

function formatLabelingRule (unFormattedRule: any): void {
  unFormattedRule.action = unFormattedRule.action.toUpperCase() as LabelingAction
}

function getValidatedColumnConfiguration (object: any): ColumnConfiguration {
  console.log('getValidatedColumnConfiguration stack', new Error().stack)

  if (!typeChecker.isObject(object)) {
    throw new TypeError('Column configuration must be an object')
  }

  typeChecker.validateObjectMember(object, 'columnName', typeChecker.types.string)

  if (!object['columnName'].length) {
    throw new ReferenceError('Column name cannot be empty string')
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
        console.warn(`Labeling rule at index: ${index} did not contain any valid labels. Skipping rule.`)
      }
    } catch (error) {
      console.warn(`  Could not make valid labeling rule from value at index: ${index}`)
      console.error(error)
    }
  })

  return {
    columnName: object['columnName'],
    labelingRules: validatedLabelingRules
  }
}

function getValidatedConfig (config: any): WorkflowConfiguraton {
  console.log('getValidatedConfig stack', new Error().stack)
  console.log('Validating Config')

  if (!typeChecker.isObject(config)) {
    throw new TypeError('column_label_config must be an object')
  }

  typeChecker.validateObjectMember(config, 'columnConfigurations', typeChecker.types.array)

  const validatedColumnConfigurations: ColumnConfiguration[] = []

  config['columnConfigurations'].forEach((columnConfiguration: any, index: number) => {
    let validatedColumnConfiguration

    try {
      validatedColumnConfiguration = getValidatedColumnConfiguration(columnConfiguration)

      if (columnConfiguration.labelingRules.length) {
        validatedColumnConfigurations.push(validatedColumnConfiguration)
      } else {
        console.warn(`Column configuration at index: ${index} did not contain any valid labeling rules. Skipping column.`)
      }
    } catch (error) {
      console.warn(`  Could not make valid column configuration from value at index: ${index}`)
      console.error(error)
    }
  })

  return {
    columnConfigurations: validatedColumnConfigurations
  }
}

function getValidatedLabelingRule (object: any): LabelingRule {
  console.log('getValidatedLabelingRule stack', new Error().stack)
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
      console.warn(`    Value at index: ${index} of label array was found not to be a string. Removing value from list.`)
    }

    return isLabelAString
  })

  return {
    action: formattedAction,
    labels: validatedLabels
  }
}

module.exports = () => {
  console.log('validatedConfig', getValidatedColumnConfiguration(columns_label_config))
}