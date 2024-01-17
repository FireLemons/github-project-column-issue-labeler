"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_line_color = require('cli-color');
const core = require('@actions/core');
class Logger {
    info(message) {
        core.info('        ' + command_line_color.cyan(message));
    }
    error(message) {
        core.error('  ' + command_line_color.red(message));
    }
    warn(message) {
        core.warning(command_line_color.yellow(message));
    }
}
module.exports = Logger;
