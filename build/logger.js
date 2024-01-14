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
    getIndentation(error) {
        const { stack } = error;
        if (!stack) {
            throw new ReferenceError('The error did not contain the stack required for computing the indentation count');
        }
        const fileNamePattern = /at main.*\/(.*.js):[\d]+:[\d]+\)/gm;
        const fileNameMatchResult = fileNamePattern.exec(stack);
        let fileName;
        if (!fileNameMatchResult) {
            throw new ReferenceError('Failed to compute indentation from stack');
        }
        else {
            fileName = fileNameMatchResult[1];
        }
        const validLinesForStackHeightPattern = new RegExp(`at .+${fileName}:[\d]+:[\d]+\)`);
        return ' '.repeat([...stack.matchAll(validLinesForStackHeightPattern)].length * this.indentationSpaceCount);
    }
    info(message) {
        console.log(command_line_color.cyan(message));
    }
    error(message) {
        console.error(command_line_color.red(message));
    }
    warn(message) {
        console.warn(command_line_color.yellow(message));
    }
}
module.exports = Logger;
