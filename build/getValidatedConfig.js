"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const githubActionsPrettyPrintLogger = __importStar(require("./githubActionsPrettyPrintLogger"));
const LabelerConfig_1 = require("./LabelerConfig");
const typeChecker = __importStar(require("./typeChecker"));
const indentation = '  ';
function isLabelingAction(str) {
    return Object.keys(LabelerConfig_1.LabelingAction).includes(str);
}
function validateColumnConfiguration(object) {
    if (!typeChecker.isObject(object)) {
        throw new TypeError('Column configuration must be an object');
    }
    typeChecker.validateObjectMember(object, 'columnName', typeChecker.Type.string);
    const validatedColumnName = object['columnName'].trim();
    if (!(validatedColumnName.length)) {
        throw new ReferenceError('columnName must contain at least one non whitespace character');
    }
    typeChecker.validateObjectMember(object, 'labelingRules', typeChecker.Type.array);
    const validatedLabelingRules = [];
    object['labelingRules'].forEach((labelingRule, index) => {
        githubActionsPrettyPrintLogger.info(`Checking labeling rule at index ${index}`, indentation.repeat(2));
        let validatedLabelingRule;
        try {
            validatedLabelingRule = getValidatedLabelingRule(labelingRule);
            if (validatedLabelingRule.labels.length) {
                validatedLabelingRules.push(validatedLabelingRule);
            }
            else {
                githubActionsPrettyPrintLogger.warn(`Labeling rule at index: ${index} did not contain any valid labels. Skipping rule.`, indentation.repeat(3));
            }
        }
        catch (error) {
            githubActionsPrettyPrintLogger.warn(`Could not make valid labeling rule from value at index: ${index}`, indentation.repeat(3));
            if (error instanceof Error && error.message) {
                githubActionsPrettyPrintLogger.error(error.message, indentation.repeat(4));
            }
        }
    });
    return {
        columnName: validatedColumnName,
        labelingRules: validatedLabelingRules
    };
}
function validateConfig(config) {
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
        githubActionsPrettyPrintLogger.info(`Checking column at index ${index}`, indentation);
        let validatedColumnConfiguration;
        try {
            validatedColumnConfiguration = validateColumnConfiguration(columnConfiguration);
            if (validatedColumnConfiguration.labelingRules.length) {
                validatedColumnConfigurations.push(validatedColumnConfiguration);
            }
            else {
                githubActionsPrettyPrintLogger.warn(`Column configuration at index: ${index} did not contain any valid labeling rules. Skipping column.`, indentation.repeat(2));
            }
        }
        catch (error) {
            githubActionsPrettyPrintLogger.warn(`Could not make valid column configuration from value at index: ${index}. Skipping column.`, indentation.repeat(2));
            if (error instanceof Error && error.message) {
                githubActionsPrettyPrintLogger.error(error.message, indentation.repeat(3));
            }
        }
    });
    return validatedColumnConfigurations;
}
exports.default = validateConfig;
function getValidatedLabelingRule(object) {
    if (!typeChecker.isObject(object)) {
        throw new TypeError('Labeling rule must be an object');
    }
    typeChecker.validateObjectMember(object, 'action', typeChecker.Type.string);
    const formattedAction = object['action'].toUpperCase().trim();
    if (!isLabelingAction(formattedAction)) {
        throw new RangeError(`Labeling action "${formattedAction}" is not supported. Supported actions are: ${JSON.stringify(Object.keys(LabelerConfig_1.LabelingAction))}`);
    }
    typeChecker.validateObjectMember(object, 'labels', typeChecker.Type.array);
    const validatedLabels = [];
    object['labels'].forEach((label, index) => {
        if (!(typeChecker.isString(label))) {
            githubActionsPrettyPrintLogger.warn(`Label at index: ${index} was found not to be a string. Removing value.`, indentation.repeat(3));
        }
        else {
            const labelWithoutSurroundingWhitespace = label.trim();
            if (!(labelWithoutSurroundingWhitespace.length)) {
                githubActionsPrettyPrintLogger.warn(`Label at index: ${index} must contain at least one non whitespace character. Removing value.`, indentation.repeat(3));
            }
            else {
                validatedLabels.push(labelWithoutSurroundingWhitespace);
            }
        }
    });
    return {
        action: formattedAction,
        labels: validatedLabels
    };
}
