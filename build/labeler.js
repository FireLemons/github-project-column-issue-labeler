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
const githubGraphQLPageAssembler_1 = require("./githubGraphQLPageAssembler");
const githubObjects_1 = require("./githubObjects");
const TypeChecker = __importStar(require("./typeChecker"));
[];
class Labeler {
    githubAPIClient;
    githubGraphQLPageAssembler;
    logger;
    stats;
    constructor(githubAPIClient, logger) {
        this.logger = logger;
        this.githubAPIClient = githubAPIClient;
        this.githubGraphQLPageAssembler = new githubGraphQLPageAssembler_1.GithubGraphQLPageAssembler(githubAPIClient);
        this.stats = {
            issueCount: 0,
            issuesWithColumnNamesCount: 0,
            issuesNotRequiringLabeling: 0,
            issuesWithFailedLabelings: 0
        };
    }
    async addRemoteSearchSpace(issue, remoteSearchSpaceQueryParameters) {
        if (remoteSearchSpaceQueryParameters) {
            const expandedColumnNameSearchSpacePOJO = (await this.githubAPIClient.fetchExpandedColumnNameSearchSpace(issue.getId())).node.projectItems;
            const expandedColumnNameSearchSpace = new githubObjects_1.GraphQLPageMergeable(expandedColumnNameSearchSpacePOJO, githubObjects_1.ProjectItem);
            issue.applyExpandedSearchSpace(expandedColumnNameSearchSpace);
        }
        else {
        }
    }
    async fetchThenProcessIssuePages(githubAPIClient) {
        let cursor;
        let hasNextPage;
        do {
            let issuePage;
            let issuePagePOJO;
            try {
                issuePagePOJO = (await githubAPIClient.fetchIssuePage(cursor)).repository.issues;
            }
            catch (error) {
                this.logger.warn('Failed to fetch an issue page. No more issue pages will be fetched.');
                this.logger.tryWarnLogErrorObject(error, 2);
                return;
            }
            try {
                issuePage = new githubObjects_1.GraphQLPage(issuePagePOJO, githubObjects_1.Issue);
                cursor = issuePage.getEndCursor();
                hasNextPage = issuePage.hasNextPage();
                this.processIssuePage(issuePage);
            }
            catch (error) {
                this.logger.warn('Failed to instantiate a graphQL issue page. This page of issues will be skipped.');
                this.logger.tryWarnLogErrorObject(error, 2);
                try {
                    const { pageInfo } = issuePagePOJO;
                    cursor = pageInfo.endCursor;
                    hasNextPage = pageInfo.hasNextPage;
                }
                catch (error) {
                    this.logger.warn('Failed to find parameters needed to fetch next page in issue page data. No more issue pages will be fetched.');
                    this.logger.tryWarnLogErrorObject(error, 2);
                    return;
                }
            }
        } while (hasNextPage);
        githubAPIClient.fetchIssuePage();
    }
    findLabelingRule(columnName, projectKey) {
        throw new Error('unimplimented');
    }
    isAlreadyLabeled(issue, labelingRule) {
        throw new Error('unimplimented');
        const labels = issue.getLabels();
        return true;
    }
    async labelIssue(issue, labels) {
    }
    async processIssue(issue) {
        try {
            let additonalRemoteSpaceFetched;
            do {
                const columnNameSearchResult = issue.findColumnName();
                additonalRemoteSpaceFetched = false;
                if (columnNameSearchResult === null) {
                    if (issue.hasInaccessibleRemoteSearchSpace()) {
                        this.logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`);
                        this.logger.error('Failed to find column name using available search space and could not fetch all column name search space');
                        this.stats.issuesWithFailedLabelings++;
                    }
                    else {
                        this.stats.issuesNotRequiringLabeling++;
                    }
                }
                else if (TypeChecker.isString(columnNameSearchResult)) {
                    const labelingRule = this.findLabelingRule(columnNameSearchResult);
                    if (labelingRule !== undefined && !(this.isAlreadyLabeled(issue, labelingRule))) {
                        this.labelIssue(issue, labelingRule);
                    }
                }
                else {
                    await this.addRemoteSearchSpace(issue, columnNameSearchResult);
                    additonalRemoteSpaceFetched = true;
                }
            } while (additonalRemoteSpaceFetched);
        }
        catch (error) {
            this.logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`);
            this.logger.tryErrorLogErrorObject(error, 2);
            this.stats.issuesWithFailedLabelings++;
            return;
        }
    }
    processIssuePage(issuePage) {
        const issues = issuePage.getNodeArray();
        for (const issue of issues) {
            this.processIssue(issue);
        }
    }
    searchLocalSearchSpaceForColumnNames(issues) {
        const remoteSearchSpaceQueryParametersWithIssue = [];
        const issuesWithColumnNames = [];
        while (issues.length > 0) {
            const issue = issues.pop();
            try {
                const columnNameSearchResult = issue.findColumnName();
                if (columnNameSearchResult === null) {
                    if (issue.hasInaccessibleRemoteSearchSpace()) {
                        this.logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`);
                        this.logger.error('Failed to find column name using available search space and could not fetch all column name search space');
                        this.stats.issuesWithFailedLabelings++;
                    }
                    else {
                        this.stats.issuesNotRequiringLabeling++;
                    }
                }
                else if (TypeChecker.isString(columnNameSearchResult)) {
                    issuesWithColumnNames.push(issue);
                }
                else {
                    remoteSearchSpaceQueryParametersWithIssue.push({
                        issue: issue,
                        remoteSearchSpaceQueryParameters: columnNameSearchResult
                    });
                }
            }
            catch (error) {
                this.logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`);
                this.logger.tryErrorLogErrorObject(error, 2);
                this.stats.issuesWithFailedLabelings++;
            }
        }
        return {
            issuesWithColumnNames,
            remoteSearchSpaceQueryParametersWithIssue
        };
    }
    async fetchRemoteSearchSpace(remoteSearchSpaceQueryParametersWithIssue) {
        const issuesWithNewlyFetchedSearchSpace = [];
        while (remoteSearchSpaceQueryParametersWithIssue.length > 0) {
            const { issue, remoteSearchSpaceQueryParameters } = remoteSearchSpaceQueryParametersWithIssue.pop();
            if (remoteSearchSpaceQueryParameters instanceof githubObjects_1.Issue) {
                try {
                    await this.githubGraphQLPageAssembler.fetchAdditionalSearchSpace(remoteSearchSpaceQueryParameters);
                    issuesWithNewlyFetchedSearchSpace.push(issue);
                }
                catch (error) {
                    issue.disableColumnNameRemoteSearchSpace();
                    this.logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`);
                    this.logger.error('Failed to find column name using available search space and could not fetch all column name search space');
                    this.logger.tryErrorLogErrorObject(error, 2);
                }
            }
            else {
                let failedSearchCount = 0; //replace with error list
                for (const singleQueryParameters of remoteSearchSpaceQueryParameters) {
                    try {
                        await this.githubGraphQLPageAssembler.fetchAdditionalSearchSpace(singleQueryParameters);
                    }
                    catch (error) {
                        failedSearchCount++;
                    }
                }
                if (failedSearchCount > 0) {
                    issue.markRemoteSearchSpaceAsNotCompletelyAcessible();
                }
                if (failedSearchCount !== remoteSearchSpaceQueryParameters.length) {
                    issuesWithNewlyFetchedSearchSpace.push(issue);
                }
                else {
                    this.logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`);
                    this.logger.error('Failed to find column name using available search space and could not fetch all column name search space');
                }
            }
        }
        return issuesWithNewlyFetchedSearchSpace;
    }
    async labelIssues() {
        let issuePage;
        try {
            this.logger.info('Fetching issues with labels and column data...');
            issuePage = await this.githubGraphQLPageAssembler.fetchAllIssues();
            this.logger.info(`Fetched ${issuePage.getEdges().length} issues`, 2);
        }
        catch (error) {
            this.logger.error('Failed to fetch issues with labels and column data', 2);
            this.logger.tryErrorLogErrorObject(error, 4);
            process.exitCode = 1;
            return;
        }
        const issues = issuePage.getNodeArray();
        this.logger.info('Searching for column names of issues');
        let issuesToBeSearched = issues.slice(0);
        do {
            const { issuesWithColumnNames, remoteSearchSpaceQueryParametersWithIssue } = this.searchLocalSearchSpaceForColumnNames(issuesToBeSearched);
            console.log(JSON.stringify(issuesWithColumnNames.map((issue) => { return issue.getNumber(); }), null, 2));
            issuesToBeSearched = await this.fetchRemoteSearchSpace(remoteSearchSpaceQueryParametersWithIssue);
        } while (issuesToBeSearched.length > 0);
    }
}
exports.default = Labeler;
