// Javascript destructuring assignment
import { GithubAPIClient } from './githubAPIClient'
import { GithubGraphQLPageAssembler } from './githubGraphQLPageAssembler'
import { GraphQLPage, Issue, RemoteRecordPageQueryParameters } from './githubObjects'
import { Logger } from './logger'
import { readFile } from 'node:fs/promises'
import * as TypeChecker from './typeChecker'
import { validateConfig } from './validateConfig'

const logger = new Logger()

interface columnNameSearchResults {
  issuesWithColumnNames: Issue[]
  issuesWithoutColumnNames: number[]
  issuesWithUnsucessfulSearches: number[]
}

async function loadConfig (): Promise<string> {
  const configContents = await readFile('./config.json')

  return '' + configContents
}

async function searchRemoteSpaceForColumnNames (remoteQueryParameters: { issue: Issue, remoteSearchSpaceQueryParameters: Issue | RemoteRecordPageQueryParameters[] }[], searchResults: columnNameSearchResults) {
  while (remoteQueryParameters.length > 0) {
    const issueWithMissingSearchSpace = remoteQueryParameters.pop()
  }
}

async function searchIssuesForColumnNames (issues: Issue[]): Promise<columnNameSearchResults> {
  const remoteSearchSpaceAccessParameters: {
    issue: Issue
    remoteSearchSpaceQueryParameters: Issue | RemoteRecordPageQueryParameters[]
  }[] = []
  const results: columnNameSearchResults = {
    issuesWithColumnNames: [],
    issuesWithoutColumnNames: [],
    issuesWithUnsucessfulSearches: []
  }

  for (let i = issues.length - 1; i >= 0; i--) {
    const issue = issues[i]

    try {
      const columnNameSearchResult = issue.findColumnName()

      if (columnNameSearchResult === null) {
        results.issuesWithoutColumnNames.push(issue.getNumber())
      } else if (TypeChecker.isString(columnNameSearchResult)) {
        results.issuesWithColumnNames.push(issue)
      } else {
        remoteSearchSpaceAccessParameters.push({
          issue: issue,
          remoteSearchSpaceQueryParameters: columnNameSearchResult
        })
      }
    } catch (error) {
      results.issuesWithUnsucessfulSearches.push(issue.getNumber())
    }
  }

  searchRemoteSpaceForColumnNames(remoteSearchSpaceAccessParameters, results)

  console.log(JSON.stringify(remoteSearchSpaceAccessParameters, null, 2))
  console.log(JSON.stringify(results, null, 2))

  return results
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

    process.exitCode = 1
    return
  }

  const config = validateConfig(configFileContents)

  if (config === null) {
    process.exitCode = 1
    return
  }

  let githubAPIClient
  let githubGraphQLPageAssembler

  try {
    logger.info('Initializing github API objects')
    githubAPIClient = new GithubAPIClient(config.accessToken, config.repo.name, config.repo.ownerName)
    githubGraphQLPageAssembler = new GithubGraphQLPageAssembler(githubAPIClient)
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to initialize github API objects', 2)
      logger.error(error.stack ?? error.message, 4)
    }

    process.exitCode = 1
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
    }

    process.exitCode = 1
    return
  }

  const issues = issuePage.getNodeArray()
  console.log(JSON.stringify(issues, null, 2))
  const columnNameSearchResults = await searchIssuesForColumnNames(issues)

  console.log(JSON.stringify(columnNameSearchResults, null, 2))
}

module.exports = main
