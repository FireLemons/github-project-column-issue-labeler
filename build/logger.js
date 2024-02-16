"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warn = exports.error = exports.info = void 0;
const cli_color_1 = __importDefault(require("cli-color"));
function makePrettyString(message, level, indentation, applyColor) {
    const messageLines = message.split('\n');
    const firstLine = applyColor(`${level}: ${indentation}${messageLines[0]}`);
    const remainingLines = messageLines.slice(1);
    const adjustedIndentation = indentation + ' '.repeat(level.length + 2);
    return [firstLine, ...remainingLines.map((line) => {
            return adjustedIndentation + applyColor(line);
        })].join('\n');
}
function info(message, indentation = '') {
    console.info(makePrettyString(message, 'INFO', indentation, cli_color_1.default.cyan));
}
exports.info = info;
function error(message, indentation = '') {
    console.error(makePrettyString(message, 'FAIL', indentation, cli_color_1.default.red));
}
exports.error = error;
function warn(message, indentation = '') {
    console.warn(makePrettyString(message, 'WARN', indentation, cli_color_1.default.yellow));
}
exports.warn = warn;
