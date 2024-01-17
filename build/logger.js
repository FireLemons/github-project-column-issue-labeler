"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_line_color = require('cli-color');
const typeChecker = require('./typeChecker');
class Logger {
    githubActionsCore;
    constructor(githubActionsCore) {
        if (!(typeChecker.isObject(githubActionsCore))) {
            throw new TypeError('Param githubActionsCore must be an object');
        }
        this.githubActionsCore = githubActionsCore;
    }
    info(message) {
        this.githubActionsCore.info(command_line_color.cyan(message));
    }
    error(message) {
        this.githubActionsCore.error(command_line_color.red(message));
    }
    warn(message) {
        this.githubActionsCore.warn(command_line_color.yellow(message));
    }
}
module.exports = Logger;
