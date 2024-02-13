import { Octokit, App } from 'octokit'
import validateConfig from './validateConfig'
import * as Logger from './logger'

let columns_label_config: string = core.getInput('column_label_config')
// Javascript destructuring assignment
const {owner, repo} = github.context.repo
const octokit = new Octokit({auth: 'PERSONAL-ACCESS-TOKEN'})
const INDENTATION = '  '
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

async function fetchIssuesWithLabelsAndColumn (): Promise<GithubAPIResponse> {
  return octokit.graphql(`
  query issuesEachWithLabelsAndColumn($pageSizeIssue: Int, $pageSizeLabel: Int, $pageSizeProjectField: Int, $pageSizeProjectItem: Int, $ownerName: String!, $repoName: String!){
    repository (owner: $ownerName, name: $repoName) {
        issues (first: $pageSizeIssue) {
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
      pageSizeIssue: ISSUE_PAGE_SIZE,
      pageSizeLabel: LABEL_PAGE_SIZE,
      pageSizeProjectField: FIELD_VALUE_PAGE_SIZE,
      pageSizeProjectItem: PROJECT_ITEM_PAGE_SIZE,
      ownerName: owner,
      repoName: repo,
    },
  )
}

function main() {
  try {
    Logger.info('Validating Config')
    const validColumnConfigurations = validateConfig(columns_label_config)

    if (!(validColumnConfigurations.length)) {
      Logger.error('Could not find any valid actions to perform from the configuration')
      process.exitCode = 1
      return
    }

    Logger.info('Validated Config:')
    Logger.info(JSON.stringify(validColumnConfigurations, null, 2))
  } catch (error) {
    if (error instanceof Error && error.message) {
      Logger.error('Failed to validate config')
      Logger.error(error.message)
      process.exitCode = 1
      return
    }
  }

  try {
      Logger.info('Fetching issues with labels and associated column data...')
      fetchIssuesWithLabelsAndColumn()
      .then(
        (response) => {
          Logger.info('Fetched issues with labels and associated column data', INDENTATION)
          Logger.info(JSON.stringify(response, null, 2), INDENTATION.repeat(2))
        }
      )
      .catch(
        (error) => {
          Logger.error('Encountered errors after fetching issues with labels and associated column data', INDENTATION)
          if(error instanceof Error) {
            Logger.error(error.message, INDENTATION.repeat(2))
          } else {
            Logger.error(error, INDENTATION.repeat(2))
          }
        }
      )
    } catch (error) {
      if (error instanceof Error && error.message) {
        Logger.error('Failed to fetch issues with labels and associated column data', INDENTATION)
        Logger.error(error.message, INDENTATION.repeat(2))
        process.exitCode = 1
      }

      return
    }
  }

module.exports = main