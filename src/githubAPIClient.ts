import * as Logger from './logger'
// Javascript destructuring assignment
import { Octokit, App } from 'octokit'

const ISSUE_PAGE_SIZE = 1//100
const FIELD_VALUE_PAGE_SIZE = 1//100
const LABEL_PAGE_SIZE = 1//20
const PROJECT_ITEM_PAGE_SIZE = 1//20

interface ColumnName {
  fieldValues: {
    nodes: [
      {
        name?: string
      }
    ]
  }
}

interface GitHubGraphQLError {
  type: string
  path: [
    string | number
  ]
  locations: [
    {
      line: number
      column: number
    }
  ],
  message: string
}

interface GithubAPIResponse {
  repository?: {
    issues: Page<Issue>
  }
  errors?: GitHubGraphQLError[]
}

interface Issue {
  id: string
  labels: Page<Label>
  projectItems: Page<ColumnName>
}

interface Label {
  name: string
}

interface Page<T> {
  edges: [
    {
      node: T
      cursor: string
    }
  ]
  pageInfo: {
    hasNextPage: boolean
  }
}

export class GithubAPIClient {
  octokit: Octokit
  repoOwnerName: string
  repoName: string

  constructor (githubAPIKey: string, repoName: string, repoOwnerName: string) {
    this.octokit = new Octokit({auth: githubAPIKey})
    this.repoName = repoName
    this.repoOwnerName = repoOwnerName
  }

  async fetchIssuePage (cursor?: string): Promise<GithubAPIResponse> {
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
      }`,
      {
        cursor: cursor,
        pageSizeIssue: ISSUE_PAGE_SIZE,
        pageSizeLabel: LABEL_PAGE_SIZE,
        pageSizeProjectField: FIELD_VALUE_PAGE_SIZE,
        pageSizeProjectItem: PROJECT_ITEM_PAGE_SIZE,
        ownerName: this.repoOwnerName,
        repoName: this.repoName,
      },
    )
  }
}