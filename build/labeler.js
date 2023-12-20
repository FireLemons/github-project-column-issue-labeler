"use strict";
const core = require('@actions/core');
const github = require('@actions/github');
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
    return Object.keys(LabelingAction).includes(str === null || str === void 0 ? void 0 : str.toUpperCase());
}
function isObject(obj) {
    return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
}
function formatLabelingRule(unFormattedRule) {
    unFormattedRule.action = unFormattedRule.action.toUpperCase();
}
function validateColumnConfiguration(object) {
    if (!isObject(object)) {
        throw new TypeError('Column configuration must be an object');
    }
}
function validateConfig(config) {
    console.log('Validating Config');
}
function validateLabelingRule(object) {
    if (!isObject(object)) {
        throw new TypeError('Labeling rule must be an object');
    }
    const { action, labels } = object;
    if (!action) {
        throw new ReferenceError('Labeling rule must contain key "action"');
    }
    if (!isLabelingAction(action)) {
        throw new RangeError(`Labeling action ${action} is not supported.\n Please select from the following: ${JSON.stringify(Object.keys(LabelingAction))}`);
    }
    if (!(Array.isArray(labels))) {
        if (labels === undefined) {
            throw new ReferenceError('Labeling rule must contain key "labels"');
        }
        else {
            throw new TypeError('Labeling rule must be an array');
        }
    }
    object['labels'] = labels.filter((label, index) => {
        const isLabelAString = typeof label === 'string';
        if (!isLabelAString) {
            console.warn(`Value at index: ${index} of label array was found not to be a string. Removing value from list.`);
        }
        return isLabelAString;
    });
    return object;
}
