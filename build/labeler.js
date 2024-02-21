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
const fs_1 = __importDefault(require("fs"));
const githubAPIClient_1 = require("./githubAPIClient");
const Logger = __importStar(require("./logger"));
const validateConfig_1 = __importDefault(require("./validateConfig"));
const fsPromises = fs_1.default.promises;
async function loadConfig() {
    const configContents = await fsPromises.readFile('./config.json');
    return "" + configContents;
}
async function main() {
    let configFileContents;
    try {
        Logger.info('Loading Config');
        configFileContents = await loadConfig();
    }
    catch (error) {
        Logger.error('Failed to load config', 2);
        if (error instanceof Error) {
            Logger.error(error.message, 4);
        }
        return;
    }
    let config;
    try {
        Logger.info('Validating Config');
        config = (0, validateConfig_1.default)(configFileContents);
        if (!(config['column-label-config'].length)) {
            Logger.error('Could not find any valid actions to perform from the configuration');
            process.exitCode = 1;
            return;
        }
        Logger.info('Validated Config:');
        Logger.info(JSON.stringify(config, null, 2));
    }
    catch (error) {
        if (error instanceof Error && error.message) {
            Logger.error('Failed to validate config');
            Logger.error(error.message);
            process.exitCode = 1;
        }
        return;
    }
    let githubAPIClient;
    try {
        githubAPIClient = new githubAPIClient_1.GithubAPIClient(config['access-token'], config.repo, config.owner);
    }
    catch (error) {
        if (error instanceof Error && error.message) {
            Logger.error('Failed to initialize github API client', 2);
            Logger.error(error.message, 4);
            process.exitCode = 1;
        }
        return;
    }
    try {
        Logger.info('Fetching issues with labels and associated column data...');
        githubAPIClient.fetchIssuePage()
            .then((response) => {
            Logger.info('Fetched issues with labels and associated column data', 2);
            Logger.info(JSON.stringify(response, null, 2), 4);
        })
            .catch((error) => {
            Logger.error('Encountered errors after fetching issues with labels and associated column data', 2);
            if (error instanceof Error) {
                Logger.error(error.message, 4);
            }
            else {
                Logger.error(error, 4);
            }
        });
    }
    catch (error) {
        if (error instanceof Error && error.message) {
            Logger.error('Failed to fetch issues with labels and associated column data', 2);
            Logger.error(error.message, 4);
            process.exitCode = 1;
        }
        return;
    }
}
module.exports = main;
