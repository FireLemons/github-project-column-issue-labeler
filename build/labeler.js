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
Object.defineProperty(exports, "__esModule", { value: true });
// Javascript destructuring assignment
const githubAPIClient_1 = require("./githubAPIClient");
const githubGraphQLPageAssembler_1 = require("./githubGraphQLPageAssembler");
const githubObjects_1 = require("./githubObjects");
const logger_1 = require("./logger");
const promises_1 = require("node:fs/promises");
const TypeChecker = __importStar(require("./typeChecker"));
const validateConfig_1 = require("./validateConfig");
const logger = new logger_1.Logger();
let githubGraphQLPageAssembler;
async function loadConfig() {
    const configContents = await (0, promises_1.readFile)('./config.json');
    return '' + configContents;
}
async function searchIssuesForColumnNames(issues) {
    logger.info('Searching for column names of issues');
    const issueFetchRequestFailureRecords = new Map();
    const remoteSearchSpaceQueryParametersWithIssue = [];
    const results = {
        issuesWithColumnNames: [],
        issuesWithoutColumnNames: [],
        issuesWithUnsucessfulSearches: []
    };
    do {
        while (issues.length > 0) {
            const issue = issues.pop();
            try {
                const columnNameSearchResult = issue.findColumnName();
                if (columnNameSearchResult === null) {
                    results.issuesWithoutColumnNames.push(issue.getNumber());
                }
                else if (TypeChecker.isString(columnNameSearchResult)) {
                    results.issuesWithColumnNames.push(issue);
                }
                else {
                    remoteSearchSpaceQueryParametersWithIssue.push({
                        issue: issue,
                        remoteSearchSpaceQueryParameters: columnNameSearchResult
                    });
                }
            }
            catch (error) {
                console.error('FAIL ALPHA');
                console.error(error);
                const unsuccessfulSearchReason = {
                    issueNumber: issue.getNumber(),
                    failureMessage: `Failed to search local search space`
                };
                if (error instanceof Error) {
                    unsuccessfulSearchReason['error'] = error;
                }
                results.issuesWithUnsucessfulSearches.push(unsuccessfulSearchReason);
            }
        }
        while (remoteSearchSpaceQueryParametersWithIssue.length > 0) {
            const { issue, remoteSearchSpaceQueryParameters } = remoteSearchSpaceQueryParametersWithIssue.pop();
            if (remoteSearchSpaceQueryParameters instanceof githubObjects_1.Issue) {
                try {
                    await githubGraphQLPageAssembler.fetchAdditionalSearchSpace(remoteSearchSpaceQueryParameters);
                    issues.push(issue);
                }
                catch (error) {
                    issue.disableColumnNameRemoteSearchSpace();
                    const unsuccessfulSearchReason = {
                        issueNumber: issue.getNumber(),
                        failureMessage: `Incomplete search. Failed to fetch some search space`
                    };
                    if (error instanceof Error) {
                        unsuccessfulSearchReason['error'] = error;
                    }
                    results.issuesWithUnsucessfulSearches.push(unsuccessfulSearchReason);
                }
            }
            else {
                let failedSearchCount = 0;
                for (const singleQueryParameters of remoteSearchSpaceQueryParameters) {
                    try {
                        await githubGraphQLPageAssembler.fetchAdditionalSearchSpace(singleQueryParameters);
                    }
                    catch (error) {
                        failedSearchCount++;
                    }
                }
                if (failedSearchCount > 0) {
                    issueFetchRequestFailureRecords.set(issue.getNumber(), null);
                }
                if (failedSearchCount !== remoteSearchSpaceQueryParameters.length) {
                    issues.push(issue);
                }
                else {
                    const unsuccessfulSearchReason = {
                        issueNumber: issue.getNumber(),
                        failureMessage: `Incomplete search. Failed to fetch some search space`
                    };
                    results.issuesWithUnsucessfulSearches.push(unsuccessfulSearchReason);
                }
            }
        }
    } while (issues.length > 0 || remoteSearchSpaceQueryParametersWithIssue.length > 0);
    return results;
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
        process.exitCode = 1;
        return;
    }
    const config = (0, validateConfig_1.validateConfig)(configFileContents);
    if (config === null) {
        process.exitCode = 1;
        return;
    }
    let githubAPIClient;
    try {
        logger.info('Initializing github API objects');
        githubAPIClient = new githubAPIClient_1.GithubAPIClient(config.accessToken, config.repo.name, config.repo.ownerName);
        githubGraphQLPageAssembler = new githubGraphQLPageAssembler_1.GithubGraphQLPageAssembler(githubAPIClient);
    }
    catch (error) {
        if (error instanceof Error) {
            logger.error('Failed to initialize github API objects', 2);
            logger.error(error.stack ?? error.message, 4);
        }
        process.exitCode = 1;
        return;
    }
    logger.info('Initialized github API client');
    let issuePage;
    try {
        logger.info('Fetching issues with labels and column data...');
        issuePage = await githubGraphQLPageAssembler.fetchAllIssues();
        logger.info(`Fetched ${issuePage.getEdges().length} issues`, 2);
    }
    catch (error) {
        if (error instanceof Error) {
            logger.error('Failed to fetch issues with labels and column data', 2);
            logger.error(error.stack ?? error.message, 4);
        }
        process.exitCode = 1;
        return;
    }
    const issues = issuePage.getNodeArray();
    const columnNameSearchResults = await searchIssuesForColumnNames(issues);
    console.log(JSON.stringify(columnNameSearchResults, null, 2));
}
module.exports = main;
