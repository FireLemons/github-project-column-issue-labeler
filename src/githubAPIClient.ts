// Javascript destructuring assignment
import { Octokit } from 'octokit'
import { pickRandom } from './util'

const colorCodes = [
  'ffebee','ffcdd2','ef9a9a','e57373','ef5350','f44336','e53935','d32f2f','c62828','b71c1c','ff8a80','ff5252','ff1744','d50000', // red
  'fce4ec','f8bbd0','f48fb1','f06292','ec407a','e91e63','d81b60','c2185b','ad1457','880e4f','ff80ab','ff4081','f50057','c51162', // pink
  'f3e5f5','e1bee7','ce93d8','ba68c8','ab47bc','9c27b0','8e24aa','7b1fa2','6a1b9a','4a148c','ea80fc','e040fb','d500f9','aa00ff', // purple
  'ede7f6','d1c4e9','b39ddb','9575cd','7e57c2','673ab7','5e35b1','512da8','4527a0','311b92','b388ff','7c4dff','651fff','6200ea', // deep-purple
  'e8eaf6','c5cae9','9fa8da','7986cb','5c6bc0','3f51b5','3949ab','303f9f','283593','1a237e','8c9eff','536dfe','3d5afe','304ffe', // indigo
  'e3f2fd','bbdefb','90caf9','64b5f6','42a5f5','2196f3','1e88e5','1976d2','1565c0','0d47a1','82b1ff','448aff','2979ff','2962ff', // blue
  'e1f5fe','b3e5fc','81d4fa','4fc3f7','29b6f6','03a9f4','039be5','0288d1','0277bd','01579b','80d8ff','40c4ff','00b0ff','0091ea', // light-blue
  'e0f7fa','b2ebf2','80deea','4dd0e1','26c6da','00bcd4','00acc1','0097a7','00838f','006064','84ffff','18ffff','00e5ff','00b8d4', // cyan
  'e0f2f1','b2dfdb','80cbc4','4db6ac','26a69a','009688','00897b','00796b','00695c','004d40','a7ffeb','64ffda','1de9b6','00bfa5', // teal
  'e8f5e9','c8e6c9','a5d6a7','81c784','66bb6a','4caf50','43a047','388e3c','2e7d32','1b5e20','b9f6ca','69f0ae','00e676','00c853', // green
  'f1f8e9','dcedc8','c5e1a5','aed581','9ccc65','8bc34a','7cb342','689f38','558b2f','33691e','ccff90','b2ff59','76ff03','64dd17', // light-green
  'f9fbe7','f0f4c3','e6ee9c','dce775','d4e157','cddc39','c0ca33','afb42b','9e9d24','827717','f4ff81','eeff41','c6ff00','aeea00', // lime
  'fffde7','fff9c4','fff59d','fff176','ffee58','ffeb3b','fdd835','fbc02d','f9a825','f57f17','ffff8d','ffff00','ffea00','ffd600', // yellow
  'fff8e1','ffecb3','ffe082','ffd54f','ffca28','ffc107','ffb300','ffa000','ff8f00','ff6f00','ffe57f','ffd740','ffc400','ffab00', // amber
  'fff3e0','ffe0b2','ffcc80','ffb74d','ffa726','ff9800','fb8c00','f57c00','ef6c00','e65100','ffd180','ffab40','ff9100','ff6d00', // orange
  'fbe9e7','ffccbc','ffab91','ff8a65','ff7043','ff5722','f4511e','e64a19','d84315','bf360c','ff9e80','ff6e40','ff3d00','dd2c00', // deep-orange
  'efebe9','d7ccc8','bcaaa4','a1887f','8d6e63','795548','6d4c41','5d4037','4e342e','3e2723', // brown
  'fafafa','f5f5f5','eeeeee','e0e0e0','bdbdbd','9e9e9e','757575','616161','424242','212121', // grey
  'eceff1','cfd8dc','b0bec5','90a4ae','78909c','607d8b','546e7a','455a64','37474f','263238', // blue-grey
  '000000', // black
  'ffffff'  // white
]

export interface ExtendedColumnNameSearchSpaceResponse {
  node: {
    number: number
    projectItems: GraphQLPagePOJO<ProjectItemPOJO>
  }
}

export interface FieldValuePageNodePOJO {
  name?: string
}

export interface FieldValuePageResponse {
  node: {
    fieldValues: GraphQLPagePOJO<FieldValuePageNodePOJO>
  }
}

export interface FieldValuePOJO {
  name: string
}

export interface GraphQLPagePOJO<T> {
  edges: {
    node: T
  }[]
  pageInfo: {
    endCursor: string | null
    hasNextPage: boolean
  }
}

export interface IssuePOJO {
  id: string
  number: number
  labels: GraphQLPagePOJO<LabelPOJO>
  projectItems: GraphQLPagePOJO<ProjectItemPOJO>
}

export interface IssuePageResponse {
  repository: {
    id?: string
    issues: GraphQLPagePOJO<IssuePOJO>
  }
}

export interface LabelCreationResponse {
  createLabel: {
    label: {
      id: string
    }
  }
}

export interface LabelPOJO {
  name: string
}

export interface LabelPOJOWithID {
  id: string
  name: string
}

export interface LabelPageOfRepoResponse {
  repository: {
    id: string
    labels: GraphQLPagePOJO<LabelPOJOWithID>
  }
}

export interface LabelPageOfIssueResponse {
  node: {
    labels: GraphQLPagePOJO<LabelPOJO>
  }
}

export interface ProjectItemPageResponse {
  node: {
    projectItems: GraphQLPagePOJO<ProjectItemPOJO>
  }
}

export interface ProjectItemPOJO {
  id: string
  fieldValues: GraphQLPagePOJO<FieldValuePageNodePOJO>
  project: {
    number: number
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

const fragmentIssuePage = `
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

const fragmentLabelPageWithIds = `
fragment labelPage on LabelConnection {
  edges{
    node{
      id
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
  #octokit: Octokit
  #repoId?: string
  #repoOwnerName: string
  #repoName: string

  constructor (githubAPIKey: string, repoName: string, repoOwnerName: string) {
    this.#octokit = new Octokit({ auth: githubAPIKey })
    this.#repoName = repoName
    this.#repoOwnerName = repoOwnerName
  }

  createLabel (labelName: string): Promise<LabelCreationResponse> {
    if (this.#repoId === undefined) {
      return new Promise((resolve, reject) => {
        reject(new ReferenceError('Repo id unset. Repo id is required for creating a label. Call setRepoId().'))
      })
    }

    return this.#octokit.graphql(`
      mutation createLabel($color: String!, $labelName: String!, $repoId: ID!){
        createLabel(input: {color: $color, name: $labelName, repositoryId: $repoId}) {
          label {
            id
          }
        }
      }`, {
        color: pickRandom(colorCodes),
        labelName,
        repoId: this.#repoId
      })
  }

  fetchExpandedColumnNameSearchSpace (issueId: string): Promise<ExtendedColumnNameSearchSpaceResponse> {
    return this.#octokit.graphql(`
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
      pageSizeFieldValue: true ? MAX_PAGE_SIZE : MIN_PAGE_SIZE,
      pageSizeProjectItem: true ? MAX_PAGE_SIZE : MIN_PAGE_SIZE
    })
  }

  fetchFieldValuePage (projectItemId: string, cursor?: string | null): Promise<FieldValuePageResponse> {
    return this.#octokit.graphql(`
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
        pageSizeFieldValue: true ? MAX_PAGE_SIZE : MIN_PAGE_SIZE,
        projectItemId
      }
    )
  }

  fetchIssuePage (cursor?: string | null): Promise<IssuePageResponse> {
    return this.#octokit.graphql(`
      query issuesEachWithLabelsAndColumn($cursor: String, $pageSizeIssue: Int!, $pageSizeLabel: Int!, $pageSizeFieldValue: Int!, $pageSizeProjectItem: Int!, $repoName: String!, $repoOwnerName: String!){
        repository (name: $repoName, owner: $repoOwnerName) {
          issues (first: $pageSizeIssue, after: $cursor) {
            ...issuePage
          }
        }
      }

      ${fragmentIssuePage}
      ${fragmentLabelPage}
      ${fragmentFieldValuePage}
      ${fragmentProjectItemPage}
      `, {
        cursor,
        pageSizeIssue: false ? MAX_PAGE_SIZE : MIN_PAGE_SIZE,
        pageSizeLabel: true ? SMALL_PAGE_SIZE : MIN_PAGE_SIZE,
        pageSizeFieldValue: true ? MAX_PAGE_SIZE : MIN_PAGE_SIZE,
        pageSizeProjectItem: true ? SMALL_PAGE_SIZE : MIN_PAGE_SIZE,
        repoName: this.#repoName,
        repoOwnerName: this.#repoOwnerName
      }
    )
  }

  fetchLabelPageOfIssue (issueId: string, cursor?: string | null): Promise<LabelPageOfIssueResponse> {
    return this.#octokit.graphql(`
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
        pageSize: true ? MAX_PAGE_SIZE : MIN_PAGE_SIZE
      }
    )
  }

  fetchLabelPageOfRepo (cursor?: string | null): Promise<LabelPageOfRepoResponse> {
    return this.#octokit.graphql(`
      query labelPageOfRepo($cursor: String, $repoName: String!, $repoOwnerName: String!, $pageSize: Int!){
        repository (name: $repoName, owner: $repoOwnerName) {
          id
          labels (after: $cursor, first: $pageSize) {
            ...labelPage
          }
        }
      }

      ${fragmentLabelPageWithIds}
      `, {
        cursor,
        pageSize: true ? MAX_PAGE_SIZE : MIN_PAGE_SIZE,
        repoName: this.#repoName,
        repoOwnerName: this.#repoOwnerName
      }
    )
  }

  fetchProjectItemPage (issueId: string, cursor?: string | null): Promise<ProjectItemPageResponse> {
    return this.#octokit.graphql(`
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
        pageSizeFieldValue: true ? MAX_PAGE_SIZE : MIN_PAGE_SIZE,
        pageSizeProjectItem: true ? MAX_PAGE_SIZE : MIN_PAGE_SIZE
      })
  }

  setRepoId (repoId: string) {
    this.#repoId = repoId
  }
}
