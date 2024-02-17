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
const Logger = __importStar(require("./logger"));
const LabelerConfig_1 = require("./LabelerConfig");
const typeChecker = __importStar(require("./typeChecker"));
function aggregateLabelsByAction(rules) {
    const aggregatedRules = new Map();
    for (const rule of rules) {
        const { action } = rule;
        if (aggregatedRules.has(action)) {
            aggregatedRules.get(action).push(...rule.labels);
        }
        else {
            aggregatedRules.set(action, [...rule.labels]);
        }
    }
    const aggregatedLabelingRules = [];
    for (const [action, labels] of aggregatedRules) {
        aggregatedLabelingRules.push({
            action: action,
            labels: labels
        });
    }
    return aggregatedLabelingRules;
}
function determineLabelingRules(rules) {
    const lastSetRuleIndex = rules.findLastIndex((rule) => rule.action === LabelerConfig_1.LabelingAction.SET);
    let determinedLabelingRules;
    if (lastSetRuleIndex >= 0) {
        Logger.info(`Found SET labeling rule at index: ${lastSetRuleIndex}`, 4);
        Logger.info('The column will be using only this rule', 4);
        determinedLabelingRules = [rules[lastSetRuleIndex]];
    }
    else {
        Logger.info('Labeling rules list only contains ADD or REMOVE rules', 4);
        Logger.info('Aggregating lables by action', 4);
        determinedLabelingRules = aggregateLabelsByAction(rules);
    }
    for (const rule of determinedLabelingRules) {
        const labelsWithoutDuplicates = filterOutCaseInsensitiveDuplicates(rule.labels);
        if (labelsWithoutDuplicates.length < rule.labels.length) {
            Logger.info(`Labels for action ${rule.action} were found to have duplicate labels`, 6);
            Logger.info('Removed duplicate labels', 6);
            rule.labels = labelsWithoutDuplicates;
        }
    }
    return determinedLabelingRules;
}
function filterOutCaseInsensitiveDuplicates(arr) {
    const sortedArray = arr.toSorted((str1, str2) => str1.localeCompare(str2, undefined, { sensitivity: 'base' }));
    for (let i = 0; i < sortedArray.length - 1; i++) {
        const currentElement = sortedArray[i];
        if (currentElement.toUpperCase() === sortedArray[i + 1].toUpperCase()) {
            sortedArray.splice(i + 1, 1);
        }
    }
    return sortedArray;
}
function isLabelingAction(str) {
    return Object.keys(LabelerConfig_1.LabelingAction).includes(str);
}
function validateColumnConfigurationsArray(arr) {
    const validatedColumnConfigurations = [];
    arr.forEach((columnConfiguration, index) => {
        Logger.info(`Checking column at index ${index}`, 2);
        let validatedColumnConfiguration;
        try {
            validatedColumnConfiguration = validateColumnConfiguration(columnConfiguration);
            if (validatedColumnConfiguration.labelingRules.length) {
                validatedColumnConfigurations.push(validatedColumnConfiguration);
            }
            else {
                Logger.warn(`Column configuration at index: ${index} did not contain any valid labeling rules. Skipping column.`, 4);
            }
        }
        catch (error) {
            Logger.warn(`Could not make valid column configuration from value at index: ${index}. Skipping column.`, 4);
            if (error instanceof Error && error.message) {
                Logger.error(error.message, 6);
            }
        }
    });
    return validatedColumnConfigurations;
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
    const validatedLabelingRules = validateLabelingRulesArray(object['labelingRules']);
    return {
        columnName: validatedColumnName,
        labelingRules: determineLabelingRules(validatedLabelingRules)
    };
}
function validateConfig(config) {
    let configAsObject;
    try {
        configAsObject = JSON.parse(config);
    }
    catch (error) {
        throw new SyntaxError('Could not parse config as JSON');
    }
    if (!(typeChecker.isObject(configAsObject))) {
        throw new TypeError('The config must be an object');
    }
    typeChecker.validateObjectMember(configAsObject, 'access-token', typeChecker.Type.string);
    typeChecker.validateObjectMember(configAsObject, 'owner', typeChecker.Type.string);
    typeChecker.validateObjectMember(configAsObject, 'repo', typeChecker.Type.string);
    typeChecker.validateObjectMember(configAsObject, 'column-label-config', typeChecker.Type.array);
    return {
        'access-token': configAsObject['access-token'].trim(),
        owner: configAsObject['owner'].trim(),
        repo: configAsObject['repo'].trim(),
        'column-label-config': validateColumnConfigurationsArray(configAsObject['column-label-config'])
    };
}
exports.default = validateConfig;
function validateLabelingRulesArray(arr) {
    const validatedLabelingRules = [];
    arr.forEach((labelingRule, index) => {
        Logger.info(`Checking labeling rule at index ${index}`, 4);
        let validatedLabelingRule;
        try {
            validatedLabelingRule = validateLabelingRule(labelingRule);
            if (validatedLabelingRule.labels.length) {
                validatedLabelingRules.push(validatedLabelingRule);
            }
            else {
                Logger.warn(`Labeling rule at index: ${index} did not contain any valid labels. Skipping rule.`, 6);
            }
        }
        catch (error) {
            Logger.warn(`Could not make valid labeling rule from value at index: ${index}`, 6);
            if (error instanceof Error && error.message) {
                Logger.error(error.message, 8);
            }
        }
    });
    return validatedLabelingRules;
}
function validateLabelingRule(object) {
    if (!typeChecker.isObject(object)) {
        throw new TypeError('Labeling rule must be an object');
    }
    typeChecker.validateObjectMember(object, 'action', typeChecker.Type.string);
    const formattedAction = object['action'].toUpperCase().trim();
    if (!isLabelingAction(formattedAction)) {
        throw new RangeError(`Labeling action "${formattedAction}" is not supported. Supported actions are: ${JSON.stringify(Object.keys(LabelerConfig_1.LabelingAction))}`);
    }
    typeChecker.validateObjectMember(object, 'labels', typeChecker.Type.array);
    return {
        action: formattedAction,
        labels: validateLabelsArray(object['labels'])
    };
}
function validateLabelsArray(arr) {
    const validatedLabels = [];
    arr.forEach((label, index) => {
        if (!(typeChecker.isString(label))) {
            Logger.warn(`Label at index: ${index} was found not to be a string. Removing value.`, 6);
        }
        else {
            const labelWithoutSurroundingWhitespace = label.trim();
            if (!(labelWithoutSurroundingWhitespace.length)) {
                Logger.warn(`Label at index: ${index} must contain at least one non whitespace character. Removing value.`, 6);
            }
            else {
                validatedLabels.push(labelWithoutSurroundingWhitespace);
            }
        }
    });
    return validatedLabels;
}
