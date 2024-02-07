import * as core from '@actions/core'
import validateConfig from './validateConfig'
import * as github from '@actions/github'
import * as githubActionsPrettyPrintLogger from './githubActionsPrettyPrintLogger'

let columns_label_config: string = core.getInput('column_label_config')
const token = core.getInput('token')
// Javascript destructuring assignment
const {owner, repo} = github.context.repo
const octokit = github.getOctokit(token)
const ISSUE_PAGE_SIZE = 100
const FIELD_VALUE_PAGE_SIZE = 100
const LABEL_PAGE_SIZE = 20
const PROJECT_ITEM_PAGE_SIZE = 20

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
  data?: Page<Issue>
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

function main() {
  try {
    githubActionsPrettyPrintLogger.info('Validating Config')
    const validColumnConfigurations = validateConfig(columns_label_config)

    if (!(validColumnConfigurations.length)) {
      githubActionsPrettyPrintLogger.error('Could not find any valid actions to perform from the configuration')
      process.exitCode = 1
      return
    }

    githubActionsPrettyPrintLogger.info('validatedConfig:')
    githubActionsPrettyPrintLogger.info(JSON.stringify(validColumnConfigurations, null, 2))
  } catch (error) {
    if (error instanceof Error && error.message) {
      githubActionsPrettyPrintLogger.error('Failed to validate config')
      githubActionsPrettyPrintLogger.error(error.message)
      process.exitCode = 1
    }
  }
  octokit.graphql(
    `
    query {
      repository (name: "gh-actions-sandbox", owner: "firelemons") {
        nameWithOwner
      }
    }
    `,
    {
      owner: "octokit",
      repo: "graphql.js",
    },
  ).then((response)=>{githubActionsPrettyPrintLogger.info(JSON.stringify(response))})

}

module.exports = main