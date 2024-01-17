"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_line_color = require('cli-color');
const core_1 = __importDefault(require("@actions/core"));
class Logger {
    info(message) {
        core_1.default.info('        ' + command_line_color.cyan(message));
    }
    error(message) {
        core_1.default.error('  ' + command_line_color.red(message));
    }
    warn(message) {
        core_1.default.warning(command_line_color.yellow(message));
    }
}
module.exports = Logger;
