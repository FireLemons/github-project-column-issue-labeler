import fs from 'fs'
// Javascript destructuring assignment
import { GithubAPIClient } from './githubAPIClient'
import { GithubGraphQLPageAssembler } from './githubGraphQLPageAssembler'
import { GraphQLPage, Issue, RemoteRecordPageQueryParameters } from './githubObjects'
import { Logger } from './logger'
import * as TypeChecker from './typeChecker'
import { validateConfig } from './validateConfig'

const fsPromises = fs.promises
const logger = new Logger()

async function loadConfig (): Promise<string> {
  const configContents = await fsPromises.readFile('./config.json')

  return '' + configContents
}

async function searchIssuesForColumnNames () {
  const incompleteSearchSpace: RemoteRecordPageQueryParameters[] = []
}

async function main () {
  let configFileContents

  try {
    logger.info('Loading Config')
    configFileContents = await loadConfig()
  } catch (error) {
    logger.error('Failed to load config', 2)
    if (error instanceof Error) {
      logger.error(error.stack ?? error.message, 4)
    }

    return
  }

  const config = validateConfig(configFileContents)

  if (config === null) {
    return
  }

  let githubAPIClient
  let githubGraphQLPageAssembler

  try {
    logger.info('Initializing github API accessors')
    githubAPIClient = new GithubAPIClient(config.accessToken, config.repo.name, config.repo.ownerName)
    githubGraphQLPageAssembler = new GithubGraphQLPageAssembler(githubAPIClient)
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to initialize github API accessors', 2)
      logger.error(error.stack ?? error.message, 4)
      process.exitCode = 1
    }

    return
  }

  logger.info('Initialized github API client')
  let issuePage: GraphQLPage<Issue>

  try {
    logger.info('Fetching issues with labels and column data...')
    issuePage = await githubGraphQLPageAssembler.fetchAllIssues()

    logger.info('Fetched issues with labels and column data', 2)
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to fetch issues with labels and column data', 2)
      logger.error(error.stack ?? error.message, 4)
      process.exitCode = 1
    }

    return
  }

  const issues = issuePage.getNodeArray()
  const issuesMissingSearchSpace: RemoteRecordPageQueryParameters[] = []
  const issuesWithColumnNames: Issue[] = []
  const issuesWithoutColumnNames: number[] = []
  const issuesWithUnsucessfulSearches: number[] = []

  for (let i = issues.length - 1; i >= 0; i--) {
    const issue = issues[i]
    const columnNameSearchResult = issue.findColumnName()

    if (columnNameSearchResult === null) {
      issuesWithoutColumnNames.push(issue.number)
    } else if (TypeChecker.isString(columnNameSearchResult)) {
      issuesWithColumnNames.push(issue)
    } else {
      issuesMissingSearchSpace.push(...columnNameSearchResult)
    }
  }



  console.log(JSON.stringify(issues[0], null, 2))
}

module.exports = main
