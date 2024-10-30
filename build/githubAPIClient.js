"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubAPIClient = void 0;
// Javascript destructuring assignment
const octokit_1 = require("octokit");
const MAX_PAGE_SIZE = 100;
const SMALL_PAGE_SIZE = 20;
const MIN_PAGE_SIZE = 1; // For testing
const fragmentFieldValuePage = `
fragment fieldValuePage on ProjectV2ItemFieldValueConnection {
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
}`;
const fragmentLabelPage = `
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
}`;
const fragmentProjectItemPage = `
fragment projectItemPage on ProjectV2ItemConnection {
  edges {
    node {
      id

      fieldValues (first: $pageSizeFieldValue) {
        ...fieldValuePage
      }

      project {
        number
        owner {
          ... on Organization {
            login
          }
          ... on User {
            login
          }
        }
      }
    }
  },
  pageInfo {
    hasNextPage
    endCursor
  }
}`;
class GithubAPIClient {
    octokit;
    repoOwnerName;
    repoName;
    constructor(githubAPIKey, repoName, repoOwnerName) {
        this.octokit = new octokit_1.Octokit({ auth: githubAPIKey });
        this.repoName = repoName;
        this.repoOwnerName = repoOwnerName;
    }
    fetchExpandedColumnNameSearchSpace(issueId) {
        return this.octokit.graphql(`
      query expandedColumnNameSearchSpace($issueId: ID!, $pageSizeFieldValue: Int!, $pageSizeProjectItem: Int!){
        node(id: $issueId) {
          ... on Issue {
            number
            projectItems (first: $pageSizeProjectItem) {
              ...projectItemPage
            }
          }
        }
      }

      ${fragmentFieldValuePage}
      ${fragmentProjectItemPage}
    `, {
            issueId,
            pageSizeFieldValue: MIN_PAGE_SIZE, //MAX_PAGE_SIZE,
            pageSizeProjectItem: MIN_PAGE_SIZE //MAX_PAGE_SIZE
        });
    }
    fetchFieldValuePage(projectItemId, cursor) {
        return this.octokit.graphql(`
      query fieldValuePage ($cursor: String, $pageSizeFieldValue: Int!, $projectItemId: ID!) {
        node (id: $projectItemId) {
          ... on ProjectV2Item {
            fieldValues (first: $pageSizeFieldValue, after: $cursor) {
              ...fieldValuePage
            }
          }
        }
      }

      ${fragmentFieldValuePage}
      `, {
            cursor,
            pageSizeFieldValue: MIN_PAGE_SIZE, //MAX_PAGE_SIZE,
            projectItemId
        });
    }
    fetchIssuePage(cursor) {
        return this.octokit.graphql(`
      query issuesEachWithLabelsAndColumn($cursor: String, $pageSizeIssue: Int!, $pageSizeLabel: Int!, $pageSizeFieldValue: Int!, $pageSizeProjectItem: Int!, $repoName: String!, $repoOwnerName: String!){
        repository (name: $repoName, owner: $repoOwnerName) {
          issues (first: $pageSizeIssue, after: $cursor) {
            ...issuePage
          }
        }
      }

      fragment issuePage on IssueConnection {
        edges {
          node {
            id
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

      ${fragmentLabelPage}
      ${fragmentFieldValuePage}
      ${fragmentProjectItemPage}
      `, {
            cursor,
            pageSizeIssue: MAX_PAGE_SIZE,
            pageSizeLabel: MIN_PAGE_SIZE, //SMALL_PAGE_SIZE,
            pageSizeFieldValue: MIN_PAGE_SIZE, //MAX_PAGE_SIZE,
            pageSizeProjectItem: MIN_PAGE_SIZE, //SMALL_PAGE_SIZE,
            repoName: this.repoName,
            repoOwnerName: this.repoOwnerName
        });
    }
    fetchLabelPage(issueId, cursor) {
        return this.octokit.graphql(`
      query pageOfLabelsOfIssue($cursor: String, $issueId: ID!, $pageSize: Int!) {
        node (id: $issueId) {
          ... on Issue {
            labels(after: $cursor, first: $pageSize){
              ...labelPage
            }
          }
        }
      }

      ${fragmentLabelPage}
      `, {
            cursor,
            issueId,
            pageSize: MIN_PAGE_SIZE //MAX_PAGE_SIZE
        });
    }
    fetchProjectItemPage(issueId, cursor) {
        return this.octokit.graphql(`
      query pageOfProjectItemsOfIssue($cursor: String, $issueId: ID!, $pageSizeFieldValue: Int!, $pageSizeProjectItem: Int!) {
        node (id: $issueId) {
          ... on Issue {
            projectItems(after: $cursor, first: $pageSizeProjectItem){
              ...projectItemPage
            }
          }
        }
      }

      ${fragmentProjectItemPage}
      ${fragmentFieldValuePage}
      `, {
            cursor,
            issueId,
            pageSizeFieldValue: MIN_PAGE_SIZE, //MAX_PAGE_SIZE,
            pageSizeProjectItem: MIN_PAGE_SIZE //MAX_PAGE_SIZE
        });
    }
}
exports.GithubAPIClient = GithubAPIClient;
