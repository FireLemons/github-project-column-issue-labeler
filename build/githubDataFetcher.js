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
exports.GithubDataFetcher = void 0;
const githubObjects_1 = require("./githubObjects");
const Logger = __importStar(require("./logger"));
class GithubDataFetcher {
    githubAPIClient;
    constructor(githubAPIClient) {
        this.githubAPIClient = githubAPIClient;
    }
    async fetchAllIssues() {
        Logger.info('Fetching Issues', 2);
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
                    Logger.warn('Encountered errors while fetching ' + pageMessageIndex, 2);
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
