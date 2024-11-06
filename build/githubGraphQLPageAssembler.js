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
    async fetchAdditionalSearchSpace(queryParams) {
        if (queryParams instanceof githubObjects_1.Issue) {
            await this.#expandIssueSearchSpace(queryParams);
        }
        else {
            await this.#expandPage(queryParams.localPage, queryParams.parentId);
        }
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
                    if (error instanceof Error) {
                        logger.warn(error.stack ?? error.message, 2);
                    }
                    issues.disableRemoteDataFetching();
                    return issues;
                }
            }
        } while (issues?.hasNextPage());
        logger.addBaseIndentation(-2);
        return issues;
    }
    async #expandPage(page, parentId) {
        const PageNodeClass = page.lookupNodeClass();
        const endCursor = page.getEndCursor();
        switch (PageNodeClass) {
            case githubObjects_1.FieldValue:
                const fieldValuePagePOJO = (await this.githubAPIClient.fetchFieldValuePage(parentId, page.getEndCursor())).node.fieldValues;
                page.appendPage(new githubObjects_1.GraphQLPage(fieldValuePagePOJO, githubObjects_1.FieldValue));
                break;
            case githubObjects_1.Label:
                const labelPagePOJO = (await this.githubAPIClient.fetchLabelPage(parentId, page.getEndCursor())).node.labels;
                page.appendPage(new githubObjects_1.GraphQLPage(labelPagePOJO, githubObjects_1.Label));
                break;
            case githubObjects_1.ProjectItem:
                const projectItemPagePOJO = (await this.githubAPIClient.fetchProjectItemPage(parentId, page.getEndCursor())).node.projectItems;
                page.appendPage(new githubObjects_1.GraphQLPageMergeable(projectItemPagePOJO, githubObjects_1.ProjectItem));
                break;
        }
    }
    async #expandIssueSearchSpace(issue) {
        const expandedColumnNameSearchSpacePOJO = (await this.githubAPIClient.fetchExpandedColumnNameSearchSpace(issue.getId())).node.projectItems;
        const expandedColumnNameSearchSpace = new githubObjects_1.GraphQLPageMergeable(expandedColumnNameSearchSpacePOJO, githubObjects_1.ProjectItem);
        issue.applyExpandedSearchSpace(expandedColumnNameSearchSpace);
    }
}
exports.GithubGraphQLPageAssembler = GithubGraphQLPageAssembler;
