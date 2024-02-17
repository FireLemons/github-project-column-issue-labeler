"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warn = exports.error = exports.info = void 0;
const cli_color_1 = __importDefault(require("cli-color"));
function indentationAmountToString(indentationAmount) {
    return ' '.repeat(indentationAmount);
}
function formatSubequentLines(lines, indentation, applyColor) {
    const formattedLines = lines.map((line) => {
        return indentationAmountToString(indentation) + applyColor(line);
    });
    if (formattedLines.length) {
        formattedLines[0] = '\n' + formattedLines[0];
    }
    return formattedLines.join('\n');
}
function makePrettyString(message, level, indentation, applyColor) {
    const messageLines = message.split('\n');
    const firstLineFormatted = applyColor(`${level}: ${indentationAmountToString(indentation)}${messageLines[0]}`);
    const remainingLinesFormatted = formatSubequentLines(messageLines.slice(1), indentation + level.length + 2, applyColor);
    return firstLineFormatted + remainingLinesFormatted;
}
function info(message, indentation = 0) {
    console.info(makePrettyString(message, 'INFO', indentation, cli_color_1.default.cyan));
}
exports.info = info;
function error(message, indentation = 0) {
    console.error(makePrettyString(message, 'FAIL', indentation, cli_color_1.default.red));
}
exports.error = error;
function warn(message, indentation = 0) {
    console.warn(makePrettyString(message, 'WARN', indentation, cli_color_1.default.yellow));
}
exports.warn = warn;
