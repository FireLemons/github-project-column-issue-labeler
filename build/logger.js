"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_line_color = require('cli-color');
class Logger {
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
