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
// Javascript destructuring assignment
const githubAPIClient_1 = require("./githubAPIClient");
const githubGraphQLPageAssembler_1 = require("./githubGraphQLPageAssembler");
const logger_1 = require("./logger");
const TypeChecker = __importStar(require("./typeChecker"));
const validateConfig_1 = require("./validateConfig");
const fsPromises = fs_1.default.promises;
const logger = new logger_1.Logger();
async function loadConfig() {
    const configContents = await fsPromises.readFile('./config.json');
    return '' + configContents;
}
async function searchIssuesForColumnNames() {
    const incompleteSearchSpace = [];
}
async function main() {
    let configFileContents;
    try {
        logger.info('Loading Config');
        configFileContents = await loadConfig();
    }
    catch (error) {
        logger.error('Failed to load config', 2);
        if (error instanceof Error) {
            logger.error(error.stack ?? error.message, 4);
        }
        return;
    }
    const config = (0, validateConfig_1.validateConfig)(configFileContents);
    if (config === null) {
        return;
    }
    let githubAPIClient;
    let githubGraphQLPageAssembler;
    try {
        logger.info('Initializing github API accessors');
        githubAPIClient = new githubAPIClient_1.GithubAPIClient(config.accessToken, config.repo.name, config.repo.ownerName);
        githubGraphQLPageAssembler = new githubGraphQLPageAssembler_1.GithubGraphQLPageAssembler(githubAPIClient);
    }
    catch (error) {
        if (error instanceof Error) {
            logger.error('Failed to initialize github API accessors', 2);
            logger.error(error.stack ?? error.message, 4);
            process.exitCode = 1;
        }
        return;
    }
    logger.info('Initialized github API client');
    let issuePage;
    try {
        logger.info('Fetching issues with labels and column data...');
        issuePage = await githubGraphQLPageAssembler.fetchAllIssues();
        logger.info('Fetched issues with labels and column data', 2);
    }
    catch (error) {
        if (error instanceof Error) {
            logger.error('Failed to fetch issues with labels and column data', 2);
            logger.error(error.stack ?? error.message, 4);
            process.exitCode = 1;
        }
        return;
    }
    const issues = issuePage.getNodeArray();
    const issuesMissingSearchSpace = [];
    const issuesWithColumnNames = [];
    const issuesWithoutColumnNames = [];
    const issuesWithUnsucessfulSearches = [];
    for (let i = issues.length - 1; i >= 0; i--) {
        const issue = issues[i];
        const columnNameSearchResult = issue.findColumnName();
        if (columnNameSearchResult === null) {
            issuesWithoutColumnNames.push(issue.number);
        }
        else if (TypeChecker.isString(columnNameSearchResult)) {
            issuesWithColumnNames.push(issue);
        }
        else {
            issuesMissingSearchSpace.push(...columnNameSearchResult);
        }
    }
    console.log(JSON.stringify(issues[0], null, 2));
}
module.exports = main;
