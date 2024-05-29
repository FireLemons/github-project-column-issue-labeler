"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubAPIClient = void 0;
// Javascript destructuring assignment
const octokit_1 = require("octokit");
const MAX_PAGE_SIZE = 100;
const ISSUE_PAGE_SIZE = MAX_PAGE_SIZE;
const FIELD_VALUE_PAGE_SIZE = 1; //MAX_PAGE_SIZE
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
    fetchIssuePage(cursor) {
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
            number
            labels (first: $pageSizeLabel) {
              ...labelPage
            }
            projectItems (first: $pageSizeProjectItem) {
              ...projectItemPage
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }

      fragment labelPage on LabelConnection {
        edges {
          node {
            name
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }

      fragment projectFieldPage on ProjectV2ItemFieldValueConnection {
        edges {
          node {
            ... on ProjectV2ItemFieldSingleSelectValue {
              name
            }
          }
        },
        pageInfo {
          hasNextPage
          endCursor
        }
      }

      fragment projectItemPage on ProjectV2ItemConnection {
        edges {
          node {
            project {
              title
            }

            fieldValues (first: $pageSizeProjectField) {
              ...projectFieldPage
            }
          }
        },
        pageInfo {
          hasNextPage
          endCursor
        }
      }`, {
            cursor: cursor,
            pageSizeIssue: ISSUE_PAGE_SIZE,
            pageSizeLabel: LABEL_PAGE_SIZE,
            pageSizeProjectField: FIELD_VALUE_PAGE_SIZE,
            pageSizeProjectItem: PROJECT_ITEM_PAGE_SIZE,
            repoName: this.repoName,
            repoOwnerName: this.repoOwnerName
        });
    }
    fetchIssueLabelPage(cursor, issueNumber) {
        return this.octokit.graphql(`query pageOfLabelsOfIssue($cursor: String!, $issueNumber: Int!, $pageSize: Int!, $repoName: String!, $repoOwnerName: String!) {
      repository(name: $repoName, owner: $repoOwnerName){
        issue(number: $issueNumber){
          labels(after: $cursor, first: $pageSize){
            ...labelPage
          }
        }
      }
    }
    
    fragment labelPage on LabelConnection {
      edges{
        node{
          name
        }
      }
      pageInfo{
        hasNextPage
        endCursor
      }
    }`, {
            "cursor": cursor,
            "issueNumber": issueNumber,
            "pageSize": MAX_PAGE_SIZE,
            "repoName": this.repoName,
            "repoOwnerName": this.repoOwnerName
        });
    }
}
exports.GithubAPIClient = GithubAPIClient;
