"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubAPIClient = void 0;
// Javascript destructuring assignment
const octokit_1 = require("octokit");
const ISSUE_PAGE_SIZE = 1; //100
const FIELD_VALUE_PAGE_SIZE = 1; //100
const LABEL_PAGE_SIZE = 1; //20
const PROJECT_ITEM_PAGE_SIZE = 1; //20
class GithubAPIClient {
    octokit;
    repoOwnerName;
    repoName;
    constructor(githubAPIKey, repoName, repoOwnerName) {
        this.octokit = new octokit_1.Octokit({ auth: githubAPIKey });
        this.repoName = repoName;
        this.repoOwnerName = repoOwnerName;
    }
    async fetchIssuePage(cursor) {
        return this.octokit.graphql(`
    query issuesEachWithLabelsAndColumn($cursor: String, $pageSizeIssue: Int!, $pageSizeLabel: Int!, $pageSizeProjectField: Int!, $pageSizeProjectItem: Int!, $ownerName: String!, $repoName: String!){
      repository (owner: $ownerName, name: $repoName) {
          issues (first: $pageSizeIssue, after: $cursor) {
            ...issuePage
          }
        }
      }

      fragment issuePage on IssueConnection {
        edges {
          node {
            id
            labels (first: $pageSizeLabel) {
              ...labelPage
            }
            projectItems (first: $pageSizeProjectItem) {
              ...projectItemPage
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
        }
      }

      fragment labelPage on LabelConnection {
        edges {
          node {
            name
          }
          cursor
        }
        pageInfo {
          hasNextPage
        }
      }

      fragment projectFieldPage on ProjectV2ItemFieldValueConnection {
        edges {
          node {
            ... on ProjectV2ItemFieldSingleSelectValue {
              name
            }
          }
          cursor
        },
        pageInfo {
          hasNextPage
        }
      }

      fragment projectItemPage on ProjectV2ItemConnection {
        edges {
          node {
            fieldValues (first: $pageSizeProjectField) {
              ...projectFieldPage
            }
          }
          cursor
        },
        pageInfo {
          hasNextPage
        }
      }`, {
            cursor: cursor,
            pageSizeIssue: ISSUE_PAGE_SIZE,
            pageSizeLabel: LABEL_PAGE_SIZE,
            pageSizeProjectField: FIELD_VALUE_PAGE_SIZE,
            pageSizeProjectItem: PROJECT_ITEM_PAGE_SIZE,
            ownerName: this.repoOwnerName,
            repoName: this.repoName,
        });
    }
}
exports.GithubAPIClient = GithubAPIClient;
