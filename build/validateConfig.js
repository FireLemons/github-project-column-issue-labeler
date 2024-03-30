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
const logger_1 = require("./logger");
const LabelerConfig_1 = require("./LabelerConfig");
const typeChecker = __importStar(require("./typeChecker"));
const logger = new logger_1.Logger();
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
        logger.info(`Found SET labeling rule at index: ${lastSetRuleIndex}`);
        logger.info('The column will be using only this rule');
        determinedLabelingRules = [rules[lastSetRuleIndex]];
    }
    else {
        logger.info('Labeling rules list only contains ADD or REMOVE rules');
        if (rules.length > 2 || (rules.length === 2 && rules[0].action === rules[1].action)) {
            logger.info('Aggregating lables by action');
            determinedLabelingRules = aggregateLabelsByAction(rules);
        }
        else {
            determinedLabelingRules = rules;
        }
    }
    logger.addBaseIndentation(2);
    for (const rule of determinedLabelingRules) {
        const labelsWithoutDuplicates = removeCaseInsensitiveDuplicates(sortLabels(rule.labels));
        if (labelsWithoutDuplicates.length < rule.labels.length) {
            logger.warn(`Labels for action ${rule.action} were found to have duplicate labels. Removed duplicate labels.`);
            rule.labels = labelsWithoutDuplicates;
        }
    }
    const addRule = determinedLabelingRules.find((labelingRule) => { return labelingRule.action === LabelerConfig_1.LabelingAction.ADD; });
    const removeRule = determinedLabelingRules.find((labelingRule) => { return labelingRule.action === LabelerConfig_1.LabelingAction.REMOVE; });
    if (addRule && removeRule) {
        removeMatchingCaseInsensitiveStringsBetweenArrays(addRule.labels, removeRule.labels);
    }
    logger.addBaseIndentation(-2);
    return determinedLabelingRules;
}
function caseInsensitiveCompare(str1, str2) {
    return str1.localeCompare(str2, undefined, { sensitivity: 'base' });
}
function removeMatchingCaseInsensitiveStringsBetweenArrays(sortedArray1, sortedArray2) {
    let cursor1 = 0, cursor2 = 0;
    while (cursor1 < sortedArray1.length && cursor2 < sortedArray2.length) {
        const comparison = caseInsensitiveCompare(sortedArray1[cursor1], sortedArray2[cursor2]);
        if (comparison < 0) {
            cursor1++;
        }
        else if (comparison > 0) {
            cursor2++;
        }
        else {
            logger.warn(`Found same label: "${sortedArray1[cursor1]}" in both ADD and REMOVE labeling rules. Removing label.`, 2);
            sortedArray1.splice(cursor1, 1);
            sortedArray2.splice(cursor2, 1);
        }
    }
}
function removeCaseInsensitiveDuplicates(sortedArray) {
    for (let i = 0; i < sortedArray.length - 1; i++) {
        if (!caseInsensitiveCompare(sortedArray[i], sortedArray[i + 1])) {
            sortedArray.splice(i + 1, 1);
        }
    }
    return sortedArray;
}
function isLabelingAction(str) {
    return Object.keys(LabelerConfig_1.LabelingAction).includes(str);
}
function sortLabels(arr) {
    return arr.toSorted(caseInsensitiveCompare);
}
function validateColumnConfigurationsArray(arr) {
    const validatedColumnConfigurations = [];
    logger.addBaseIndentation(2);
    arr.forEach((columnConfiguration, index) => {
        logger.info(`Checking column at index ${index}`);
        let validatedColumnConfiguration;
        logger.addBaseIndentation(2);
        try {
            validatedColumnConfiguration = validateColumnConfiguration(columnConfiguration);
            if (validatedColumnConfiguration.labelingRules.length) {
                validatedColumnConfigurations.push(validatedColumnConfiguration);
            }
            else {
                logger.warn(`Column configuration at index: ${index} did not contain any valid labeling rules. Skipping column.`);
            }
        }
        catch (error) {
            logger.warn(`Could not make valid column configuration from value at index: ${index}. Skipping column.`);
            if (error instanceof Error && error.message) {
                logger.error(error.message, 2);
            }
        }
        logger.addBaseIndentation(-2);
    });
    logger.addBaseIndentation(-2);
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
    const trimmedGithubAccessToken = configAsObject['access-token'].trim();
    if (!(trimmedGithubAccessToken.length)) {
        throw new RangeError('The github access token cannot be empty or contain only whitespace');
    }
    return {
        'access-token': trimmedGithubAccessToken,
        owner: configAsObject['owner'].trim(),
        repo: configAsObject['repo'].trim(),
        'column-label-config': validateColumnConfigurationsArray(configAsObject['column-label-config'])
    };
}
exports.default = validateConfig;
function validateLabelingRulesArray(arr) {
    const validatedLabelingRules = [];
    arr.forEach((labelingRule, index) => {
        logger.info(`Checking labeling rule at index ${index}`);
        let validatedLabelingRule;
        logger.addBaseIndentation(2);
        try {
            validatedLabelingRule = validateLabelingRule(labelingRule);
            if (validatedLabelingRule.labels.length) {
                validatedLabelingRules.push(validatedLabelingRule);
            }
            else {
                logger.warn(`Labeling rule at index: ${index} did not contain any valid labels. Skipping rule.`);
            }
        }
        catch (error) {
            logger.warn(`Could not make valid labeling rule from value at index: ${index}. Skipping rule.`);
            if (error instanceof Error && error.message) {
                logger.error(error.message, 2);
            }
        }
        logger.addBaseIndentation(-2);
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
            logger.warn(`Label at index: ${index} was found not to be a string. Removing value.`);
        }
        else {
            const labelWithoutSurroundingWhitespace = label.trim();
            if (!(labelWithoutSurroundingWhitespace.length)) {
                logger.warn(`Label at index: ${index} must contain at least one non whitespace character. Removing value.`);
            }
            else {
                validatedLabels.push(labelWithoutSurroundingWhitespace);
            }
        }
    });
    return validatedLabels;
}
