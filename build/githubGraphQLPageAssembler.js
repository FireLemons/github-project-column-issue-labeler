"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubGraphQLPageAssembler = void 0;
const githubObjects_1 = require("./githubObjects");
const logger_1 = require("./logger");
const logger = new logger_1.Logger();
class GithubGraphQLPageAssembler {
    githubAPIClient;
    constructor(githubAPIClient) {
        this.githubAPIClient = githubAPIClient;
    }
    async fetchAllIssues() {
        logger.addBaseIndentation(2);
        let cursor;
        let issues;
        let issuePageResponse;
        do {
            try {
                issuePageResponse = await this.githubAPIClient.fetchIssuePage(cursor);
                const issuePage = new githubObjects_1.GraphQLPage(issuePageResponse.repository?.issues, githubObjects_1.Issue);
                cursor = issuePage.getEndCursor();
                if (issues === undefined) {
                    issues = issuePage;
                }
                else {
                    issues.appendPage(issuePage);
                }
            }
            catch (error) {
                if (issues === undefined || issues.isEmpty()) {
                    throw error;
                }
                else {
                    logger.warn('Failed to fetch all issues. Continuing with subset of successfully fetched issues');
                    logger.tryWarnLogErrorObject(error, 2);
                    issues.disableRemoteDataFetching();
                    return issues;
                }
            }
        } while (issues?.hasNextPage());
        logger.addBaseIndentation(-2);
        return issues;
    }
}
exports.GithubGraphQLPageAssembler = GithubGraphQLPageAssembler;
