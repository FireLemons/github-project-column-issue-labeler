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
const core = __importStar(require("@actions/core"));
const validateConfig_1 = __importDefault(require("./validateConfig"));
const github = __importStar(require("@actions/github"));
const githubActionsPrettyPrintLogger = __importStar(require("./githubActionsPrettyPrintLogger"));
let columns_label_config = core.getInput('column_label_config');
const token = core.getInput('token');
// Javascript destructuring assignment
const { owner, repo } = github.context.repo;
const octokit = github.getOctokit(token);
function main() {
    try {
        githubActionsPrettyPrintLogger.info('Validating Config');
        const validColumnConfigurations = (0, validateConfig_1.default)(columns_label_config);
        if (!(validColumnConfigurations.length)) {
            githubActionsPrettyPrintLogger.error('Could not find any valid actions to perform from the configuration');
            process.exitCode = 1;
            return;
        }
        githubActionsPrettyPrintLogger.info('validatedConfig:');
        githubActionsPrettyPrintLogger.info(JSON.stringify(validColumnConfigurations, null, 2));
    }
    catch (error) {
        if (error instanceof Error && error.message) {
            githubActionsPrettyPrintLogger.error('Failed to validate config');
            githubActionsPrettyPrintLogger.error(error.message);
            process.exitCode = 1;
        }
    }
}
module.exports = main;
