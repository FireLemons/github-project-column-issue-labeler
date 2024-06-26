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
        logger.info('Fetching Issues');
        let cursor;
        let issues;
        let issuePageResponse;
        do {
            try {
                issuePageResponse = await this.githubAPIClient.fetchIssuePage(cursor);
                if (issuePageResponse) {
                    const issuePage = new githubObjects_1.GraphQLPage(issuePageResponse.repository?.issues);
                    cursor = issuePage.getEndCursor();
                    if (!issues) {
                        issues = issuePage;
                    }
                    else {
                        issues.appendPage(issuePage);
                    }
                }
            }
            catch (error) {
                if (issuePageResponse?.repository) {
                    let pageMessageIndex = cursor ? `page with cursor ${cursor}` : 'first page';
                    logger.warn('Encountered errors while fetching ' + pageMessageIndex);
                }
                else {
                    throw error;
                }
            }
        } while (!(issues.isLastPage()));
        logger.addBaseIndentation(-2);
        return issues;
    }
}
exports.GithubGraphQLPageAssembler = GithubGraphQLPageAssembler;
