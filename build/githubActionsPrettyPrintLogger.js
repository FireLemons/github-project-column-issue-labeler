"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warn = exports.error = exports.info = void 0;
const cli_color_1 = __importDefault(require("cli-color"));
function makePrettyString(message, indentation, applyColor) {
    const messageLines = message.split('\n');
    return messageLines.map((line) => {
        return indentation + applyColor(line);
    }).join('\n');
}
function info(message, indentation = '') {
    console.info(makePrettyString('INFO:' + message, indentation, cli_color_1.default.cyan));
}
exports.info = info;
function error(message, indentation = '') {
    console.error(makePrettyString('FAIL' + message, indentation, cli_color_1.default.red));
}
exports.error = error;
function warn(message, indentation = '') {
    console.warn(makePrettyString('WARN' + message, indentation, cli_color_1.default.yellow));
}
exports.warn = warn;
