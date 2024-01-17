"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warn = exports.error = exports.info = void 0;
const command_line_color = require('cli-color');
const core = require('@actions/core');
function info(message) {
    core.info('        ' + command_line_color.cyan(message));
}
exports.info = info;
function error(message) {
    core.error('  ' + command_line_color.red(message));
}
exports.error = error;
function warn(message) {
    core.warning(command_line_color.yellow(message));
}
exports.warn = warn;
