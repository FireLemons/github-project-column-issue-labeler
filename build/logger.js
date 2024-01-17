"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_line_color = require('cli-color');
class Logger {
    indentationSpaceCount;
    mainFunctionName;
    showDebugOutput;
    constructor(mainFunctionName, indentationSpaceCount = 2, showDebugOutput = false) {
        if (showDebugOutput) {
            if (mainFunctionName) {
                console.log(`Main function name set to ${mainFunctionName}. This is used to automatically determine the indentation space for logging.`);
                console.log(`Indentation space count set to ${indentationSpaceCount}`);
            }
            else {
                console.log('Auto indentation not enabled.');
            }
        }
        this.indentationSpaceCount = indentationSpaceCount;
        this.mainFunctionName = mainFunctionName;
        this.showDebugOutput = showDebugOutput;
    }
    #getStackHeightOfFunctionsWithinSameFile() {
        const { stack } = new Error();
        console.error(stack);
        if (!stack) {
            throw new ReferenceError('The error did not contain the stack required for computing the indentation count');
        }
        const fileNamePattern = new RegExp(`at (Object\\.)?${this.mainFunctionName}.*\\/(.*.js):[\\d]+:[\\d]+\\)`);
        const fileNameMatchResult = fileNamePattern.exec(stack);
        let fileName;
        if (!fileNameMatchResult) {
            throw new ReferenceError('Failed to compute indentation from stack');
        }
        else {
            fileName = fileNameMatchResult[2];
        }
        const validLinesForStackHeightPattern = new RegExp(`at .+${fileName}:[\\d]+:[\\d]+\\)`, 'g');
        return [...stack.matchAll(validLinesForStackHeightPattern)].findIndex((stackLineMatch) => {
            return fileNamePattern.test(stackLineMatch[0]);
        });
    }
    #getIndentation() {
        if (!(this.mainFunctionName)) {
            return '';
        }
        return ' '.repeat(this.#getStackHeightOfFunctionsWithinSameFile() * this.indentationSpaceCount);
    }
    info(message) {
        let indentation = '';
        try {
            indentation = this.#getIndentation();
        }
        catch (error) {
            if (this.showDebugOutput) {
                console.error(error);
            }
        }
        console.log(command_line_color.cyan(indentation + message));
    }
    error(message) {
        let indentation = '';
        try {
            indentation = this.#getIndentation();
        }
        catch (error) {
            if (this.showDebugOutput) {
                console.error(error);
            }
        }
        console.error(command_line_color.red(indentation + message));
    }
    warn(message) {
        let indentation = '';
        try {
            indentation = this.#getIndentation();
        }
        catch (error) {
            if (this.showDebugOutput) {
                console.error(error);
            }
        }
        console.warn(command_line_color.yellow(indentation + message));
    }
}
module.exports = Logger;
