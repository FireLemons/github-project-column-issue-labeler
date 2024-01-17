"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require('@actions/core');
const github = require('@actions/github');
const LoggerClass = require('./logger');
const logger = new LoggerClass('main', 2, true);
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
function getValidatedColumnConfiguration(object) {
    if (!typeChecker.isObject(object)) {
        throw new TypeError('Column configuration must be an object');
    }
    typeChecker.validateObjectMember(object, 'columnName', typeChecker.types.string);
    const validatedColumnName = object['columnName'].trim();
    if (!(validatedColumnName.length)) {
        throw new ReferenceError('columnName must contain at least one non whitespace character');
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
            if (error instanceof Error && error.message) {
                logger.error('  ' + error.message);
            }
        }
    });
    return {
        columnName: validatedColumnName,
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
        logger.info(`Checking column at index ${index}`);
        let validatedColumnConfiguration;
        try {
            validatedColumnConfiguration = getValidatedColumnConfiguration(columnConfiguration);
            if (validatedColumnConfiguration.labelingRules.length) {
                validatedColumnConfigurations.push(validatedColumnConfiguration);
            }
            else {
                logger.warn(`  Column configuration at index: ${index} did not contain any valid labeling rules. Skipping column.`);
            }
        }
        catch (error) {
            logger.warn(`  Could not make valid column configuration from value at index: ${index}. Skipping column.`);
            if (error instanceof Error && error.message) {
                logger.error('    ' + error.message);
            }
        }
    });
    return validatedColumnConfigurations;
}
function getValidatedLabelingRule(object) {
    if (!typeChecker.isObject(object)) {
        throw new TypeError('Labeling rule must be an object');
    }
    typeChecker.validateObjectMember(object, 'action', typeChecker.types.string);
    const formattedAction = object['action'].toUpperCase().trim();
    if (!isLabelingAction(formattedAction)) {
        throw new RangeError(`Labeling action "${formattedAction}" is not supported. Supported actions are: ${JSON.stringify(Object.keys(LabelingAction))}`);
    }
    typeChecker.validateObjectMember(object, 'labels', typeChecker.types.array);
    const validatedLabels = object['labels'].filter((label, index) => {
        const isLabelAString = typeChecker.isString(label);
        if (!isLabelAString) {
            logger.warn(`Value at index: ${index} of label array was found not to be a string. Removing value from list.`);
        }
        else if (!(label.trim().length)) {
            logger.warn(`Value at index: ${index} of label must contain at least one non whitespace character. Removing value from list.`);
        }
        return isLabelAString;
    });
    return {
        action: formattedAction,
        labels: validatedLabels
    };
}
function main() {
    try {
        logger.info('Validating Config');
        const validColumnConfigurations = getValidatedConfig(columns_label_config);
        if (!(validColumnConfigurations.length)) {
            logger.error('Could not find any valid actions to perform from the configuration');
            process.exitCode = 1;
            return;
        }
        logger.info('validatedConfig:');
        logger.info(JSON.stringify(validColumnConfigurations, null, 2));
    }
    catch (error) {
        if (error instanceof Error && error.message) {
            logger.error(error.message);
            process.exitCode = 1;
        }
    }
}
module.exports = main;
