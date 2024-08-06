"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.Indentation = void 0;
const cli_color_1 = __importDefault(require("cli-color"));
var Indentation;
(function (Indentation) {
    Indentation["space"] = " ";
    Indentation["tab"] = "\t";
})(Indentation || (exports.Indentation = Indentation = {}));
class Logger {
    baseIndentation;
    indentationCharacter;
    constructor(indentationCharacter = Indentation.space) {
        this.baseIndentation = 0;
        this.indentationCharacter = indentationCharacter;
    }
    addBaseIndentation(amount) {
        this.baseIndentation = Math.max(0, this.baseIndentation + amount);
        // console.log(`Indentation: ${this.baseIndentation}`)
    }
    info(message, indentationCount = 0) {
        console.info(this.#makePrettyString(message, 'INFO', this.baseIndentation + indentationCount, cli_color_1.default.cyan));
    }
    error(message, indentationCount = 0) {
        console.error(this.#makePrettyString(message, 'FAIL', this.baseIndentation + indentationCount, cli_color_1.default.red));
    }
    warn(message, indentationCount = 0) {
        console.warn(this.#makePrettyString(message, 'WARN', this.baseIndentation + indentationCount, cli_color_1.default.yellow));
    }
    #indentationAmountToString(indentationAmount) {
        return this.indentationCharacter.repeat(indentationAmount);
    }
    #formatSubequentLines(lines, spaceIndentationCount, applyColor) {
        if (!(lines.length)) {
            return '';
        }
        const formattedLines = lines.map((line) => {
            return this.#indentationAmountToString(spaceIndentationCount) + applyColor(line);
        });
        formattedLines[0] = '\n' + formattedLines[0];
        return formattedLines.join('\n');
    }
    #makePrettyString(message, level, spaceIndentationCount, applyColor) {
        const messageLines = message.split('\n');
        const firstLineFormatted = applyColor(`${level}: ${this.#indentationAmountToString(spaceIndentationCount)}${messageLines[0]}`);
        const remainingLinesFormatted = this.#formatSubequentLines(messageLines.slice(1), spaceIndentationCount + level.length + 2, applyColor);
        return firstLineFormatted + remainingLinesFormatted;
    }
}
exports.Logger = Logger;
