"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warn = exports.error = exports.info = void 0;
const cli_color_1 = __importDefault(require("cli-color"));
const core = __importStar(require("@actions/core"));
function makePrettyString(message, indentation, applyColor) {
    const messageLines = message.split('\n');
    return messageLines.map((line) => {
        return indentation + applyColor(line);
    }).join('\n');
}
function info(message, indentation = '') {
    const adjustedIndentation = indentation + '         '; // Used to line up with warning messages prefixed with "Warning: "
    core.info(makePrettyString(message, adjustedIndentation, cli_color_1.default.cyan));
}
exports.info = info;
function error(message, indentation = '') {
    const adjustedIndentation = indentation + '  ';
    core.error(makePrettyString(message, adjustedIndentation, cli_color_1.default.red));
}
exports.error = error;
function warn(message, indentation = '') {
    core.warning(makePrettyString(message, indentation, cli_color_1.default.yellow));
}
exports.warn = warn;
