"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require('@actions/core');
const github = require('@actions/github');
const LoggerClass = require('./logger');
const logger = new LoggerClass('main');
const typeChecker = require('./typeChecker');
let columns_label_config = core.getInput('column_label_config');
const token = core.getInput('token');
// Javascript destructuring assignment
const { owner, repo } = github.context.repo;
const octokit = github.getOctokit(token);
var LabelingAction;
(function (LabelingAction) {
    LabelingAction["ADD"] = "ADD";
    LabelingAction["REMOVE"] = "REMOVE";
    LabelingAction["SET"] = "SET";
})(LabelingAction || (LabelingAction = {}));
function isLabelingAction(str) {
    return Object.keys(LabelingAction).includes(str);
}
function formatLabelingRule(unFormattedRule) {
    unFormattedRule.action = unFormattedRule.action.toUpperCase();
}
function getValidatedColumnConfiguration(object) {
    if (!typeChecker.isObject(object)) {
        throw new TypeError('Column configuration must be an object');
    }
    typeChecker.validateObjectMember(object, 'columnName', typeChecker.types.string);
    if (!object['columnName'].length) {
        throw new ReferenceError('Column name cannot be empty string');
    }
    typeChecker.validateObjectMember(object, 'labelingRules', typeChecker.types.array);
    const validatedLabelingRules = [];
    object['labelingRules'].forEach((labelingRule, index) => {
        let validatedLabelingRule;
        try {
            validatedLabelingRule = getValidatedLabelingRule(labelingRule);
            if (validatedLabelingRule.labels.length) {
                validatedLabelingRules.push(validatedLabelingRule);
            }
            else {
                logger.warn(`Labeling rule at index: ${index} did not contain any valid labels. Skipping rule.`);
            }
        }
        catch (error) {
            logger.warn(`Could not make valid labeling rule from value at index: ${index}`);
            logger.error(error);
        }
    });
    return {
        columnName: object['columnName'],
        labelingRules: validatedLabelingRules
    };
}
function getValidatedConfig(config) {
    if (config === '') {
        throw new ReferenceError('Missing required input "column_label_config"');
    }
    try {
        config = JSON.parse(config);
    }
    catch (error) {
        throw new SyntaxError('Could not parse input "column_label_config" as JSON');
    }
    if (!(Array.isArray(config))) {
        throw new TypeError('input "column_label_config" must be an array');
    }
    const validatedColumnConfigurations = [];
    config.forEach((columnConfiguration, index) => {
        let validatedColumnConfiguration;
        try {
            validatedColumnConfiguration = getValidatedColumnConfiguration(columnConfiguration);
            if (columnConfiguration.labelingRules.length) {
                validatedColumnConfigurations.push(validatedColumnConfiguration);
            }
            else {
                logger.warn(`Column configuration at index: ${index} did not contain any valid labeling rules. Skipping column.`);
            }
        }
        catch (error) {
            logger.warn(`Could not make valid column configuration from value at index: ${index}`);
            if (error instanceof Error && error.message) {
                logger.error('  ' + error.message);
            }
        }
    });
    return validatedColumnConfigurations;
}
function getValidatedLabelingRule(object) {
    logger.info('getValidatedLabelingRule stack', new Error().stack);
    if (!typeChecker.isObject(object)) {
        throw new TypeError('Labeling rule must be an object');
    }
    typeChecker.validateObjectMember(object, 'action', typeChecker.types.string);
    const formattedAction = object['action'].toUpperCase();
    if (!isLabelingAction(formattedAction)) {
        throw new RangeError(`Labeling action "${formattedAction}" is not supported.\n Please select from the following: ${JSON.stringify(Object.keys(LabelingAction))}`);
    }
    typeChecker.validateObjectMember(object, 'labels', typeChecker.types.array);
    const validatedLabels = object['labels'].filter((label, index) => {
        const isLabelAString = typeChecker.isString(label);
        if (!isLabelAString) {
            logger.warn(`Value at index: ${index} of label array was found not to be a string. Removing value from list.`);
        }
        return isLabelAString;
    });
    return {
        action: formattedAction,
        labels: validatedLabels
    };
}
function main() {
    logger.info('Validating Config');
    const validColumnConfigurations = getValidatedConfig(columns_label_config);
    if (!(validColumnConfigurations.length)) {
        logger.error('The list of validated configurations for columns was found to be empty');
        return;
    }
    logger.info('validatedConfig', validColumnConfigurations);
}
module.exports = main;
