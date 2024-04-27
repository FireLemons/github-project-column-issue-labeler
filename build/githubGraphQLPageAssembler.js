"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubDataFetcher = void 0;
const githubObjects_1 = require("./githubObjects");
const logger_1 = require("./logger");
const logger = new logger_1.Logger();
class GithubDataFetcher {
    githubAPIClient;
    constructor(githubAPIClient) {
        this.githubAPIClient = githubAPIClient;
    }
    async fetchAllIssues() {
        logger.info('Fetching Issues', 2);
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
                if (issuePageResponse.repository) {
                    let pageMessageIndex = cursor ? `page with cursor ${cursor}` : 'first page';
                    logger.warn('Encountered errors while fetching ' + pageMessageIndex, 2);
                }
                else {
                    throw error;
                }
            }
        } while (!(issues.isLastPage()));
        return issues;
    }
}
exports.GithubDataFetcher = GithubDataFetcher;
