// Javascript destructuring assignment
import { Octokit, App } from 'octokit'

interface ExtendedColumnNameSearchSpaceResponse {
  repository: {
    issue: IssueContainingExpandedSearchSpacePOJO
  }
}

interface FieldValuePageNodePOJO {
  name?: string
}

interface FieldValuePageResponse {
  
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
  ]
  message: string
}

interface GraphQLPagePOJO<T> {
  edges: {
    node: T
  }[]
  pageInfo: {
    endCursor: string
    hasNextPage: boolean
  }
}

interface IssuePOJO {
  number: number,
  labels: GraphQLPagePOJO<LabelPOJO>
  projectItems: GraphQLPagePOJO<ProjectItemPOJO>
}

interface IssueContainingExpandedSearchSpacePOJO {
  number: number,
  projectItems: GraphQLPagePOJO<ProjectItemPOJO>
}

interface IssueContainingLabelPagePOJO {
  labels: GraphQLPagePOJO<LabelPOJO>
}

export interface IssuePageResponse {
  repository: {
    issues: GraphQLPagePOJO<IssuePOJO>
  }
}

interface LabelPOJO {
  name: string
}

interface LabelPageResponse {
  repository: {
    issue: IssueContainingLabelPagePOJO
  }
}

interface ProjectItemPOJO {
  id: string
  fieldValues: GraphQLPagePOJO<FieldValuePageNodePOJO>,
  project: {
    number: number,
    owner: {
      login: string
    }
  }
}

const MAX_PAGE_SIZE = 100
const SMALL_PAGE_SIZE = 20
const MIN_PAGE_SIZE = 1 // For testing

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
}`

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
}`

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
}`

export class GithubAPIClient {
  octokit: Octokit
  repoOwnerName: string
  repoName: string

  constructor (githubAPIKey: string, repoName: string, repoOwnerName: string) {
    this.octokit = new Octokit({ auth: githubAPIKey })
    this.repoName = repoName
    this.repoOwnerName = repoOwnerName
  }

  fetchExpandedColumnNameSearchSpace (issueNumber: number): Promise<ExtendedColumnNameSearchSpaceResponse> {
    return this.octokit.graphql(`
      query expandedColumnNameSearchSpace($issueNumber: Int!, $pageSizeFieldValue: Int!, $pageSizeProjectItem: Int!, $repoOwnerName: String!, $repoName: String!){
        repository (name: $repoName, owner: $repoOwnerName) {
          issue (number: $issueNumber) {
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
      issueNumber,
      pageSizeFieldValue: MAX_PAGE_SIZE,
      pageSizeProjectItem: MAX_PAGE_SIZE,
      repoName: this.repoName,
      repoOwnerName: this.repoOwnerName
    })
  }

  fetchFieldValuePage (): Promise<FieldValuePageResponse> {
    return this.octokit.graphql(`
    
    `, {

    })
  }

  fetchIssuePage (cursor?: string): Promise<IssuePageResponse> {
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
        pageSizeIssue: MIN_PAGE_SIZE, //MAX_PAGE_SIZE,
        pageSizeLabel: MIN_PAGE_SIZE, //SMALL_PAGE_SIZE,
        pageSizeFieldValue: MIN_PAGE_SIZE, //MAX_PAGE_SIZE,
        pageSizeProjectItem: MIN_PAGE_SIZE, //SMALL_PAGE_SIZE,
        repoName: this.repoName,
        repoOwnerName: this.repoOwnerName
      }
    )
  }

  fetchIssueLabelPage (issueNumber: number, cursor?: string): Promise<LabelPageResponse> {
    return this.octokit.graphql(`query pageOfLabelsOfIssue($cursor: String, $issueNumber: Int!, $pageSize: Int!, $repoName: String!, $repoOwnerName: String!) {
      repository(name: $repoName, owner: $repoOwnerName){
        issue(number: $issueNumber){
          labels(after: $cursor, first: $pageSize){
            ...labelPage
          }
        }
      }
    }

    ${fragmentLabelPage}
    `, {
      cursor,
      issueNumber,
      pageSize: MAX_PAGE_SIZE,
      repoName: this.repoName,
      repoOwnerName: this.repoOwnerName
    })
  }
}
