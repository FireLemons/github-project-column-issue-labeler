// Javascript destructuring assignment
import { GithubAPIClient } from './githubAPIClient'
import { GithubGraphQLPageAssembler } from './githubGraphQLPageAssembler'
import { GraphQLPage, Issue, RemoteRecordPageQueryParameters } from './githubObjects'
import { Logger } from './logger'
import { readFile } from 'node:fs/promises'
import * as TypeChecker from './typeChecker'
import { validateConfig } from './validateConfig'

interface unsuccessfulSearchReason {
  issueNumber: number,
  error?: Error,
  failureMessage: string
}

interface columnNameSearchResults {
  issuesWithColumnNames: Issue[]
  issuesWithoutColumnNames: number[]
  issuesWithUnsucessfulSearches: unsuccessfulSearchReason[]
}

const logger = new Logger()
let githubGraphQLPageAssembler: GithubGraphQLPageAssembler

async function loadConfig (): Promise<string> {
  const configContents = await readFile('./config.json')

  return '' + configContents
}

async function searchIssuesForColumnNames (issues: Issue[]): Promise<columnNameSearchResults> {
  logger.info('Searching for column names of issues')

  const issueFetchRequestFailureRecords = new Map<number, null>()
  const remoteSearchSpaceQueryParametersWithIssue: {
    issue: Issue
    remoteSearchSpaceQueryParameters: Issue | RemoteRecordPageQueryParameters[]
  }[] = []

  const results: columnNameSearchResults = {
    issuesWithColumnNames: [],
    issuesWithoutColumnNames: [],
    issuesWithUnsucessfulSearches: []
  }

  do {
    while(issues.length > 0) {
      const issue = issues.pop()!

      try {
        const columnNameSearchResult = issue.findColumnName()
        if (columnNameSearchResult === null) {
          results.issuesWithoutColumnNames.push(issue.getNumber())
        } else if (TypeChecker.isString(columnNameSearchResult)) {
          results.issuesWithColumnNames.push(issue)
        } else {
          remoteSearchSpaceQueryParametersWithIssue.push({
            issue: issue,
            remoteSearchSpaceQueryParameters: columnNameSearchResult
          })
        }
      } catch (error) {
        console.error('FAIL ALPHA')
        console.error(error)
        const unsuccessfulSearchReason: unsuccessfulSearchReason = {
          issueNumber: issue.getNumber(),
          failureMessage: `Failed to search local search space`
        }

        if (error instanceof Error) {
          unsuccessfulSearchReason['error'] = error
        }

        results.issuesWithUnsucessfulSearches.push(unsuccessfulSearchReason)
      }
    }

    while(remoteSearchSpaceQueryParametersWithIssue.length > 0) {
      const { issue, remoteSearchSpaceQueryParameters } = remoteSearchSpaceQueryParametersWithIssue.pop()!
      if (remoteSearchSpaceQueryParameters instanceof Issue) {
        try {
          await githubGraphQLPageAssembler.fetchAdditionalSearchSpace(remoteSearchSpaceQueryParameters)
          issues.push(issue)
        } catch (error) {
          issue.disableColumnNameRemoteSearchSpace()

          const unsuccessfulSearchReason: unsuccessfulSearchReason = {
            issueNumber: issue.getNumber(),
            failureMessage: `Incomplete search. Failed to fetch some search space`
          }

          if (error instanceof Error) {
            unsuccessfulSearchReason['error'] = error
          }

          results.issuesWithUnsucessfulSearches.push(unsuccessfulSearchReason)
        }
      } else {
        let failedSearchCount = 0

        for (const singleQueryParameters of remoteSearchSpaceQueryParameters) {
          try {
            await githubGraphQLPageAssembler.fetchAdditionalSearchSpace(singleQueryParameters)
          } catch (error) {
            failedSearchCount++
          }
        }

        if (failedSearchCount > 0) {
          issueFetchRequestFailureRecords.set(issue.getNumber(), null)
        }

        if (failedSearchCount !== remoteSearchSpaceQueryParameters.length) {
          issues.push(issue)
        } else {
          const unsuccessfulSearchReason: unsuccessfulSearchReason = {
            issueNumber: issue.getNumber(),
            failureMessage: `Incomplete search. Failed to fetch some search space`
          }

          results.issuesWithUnsucessfulSearches.push(unsuccessfulSearchReason)
        }
      }
    }
  } while (issues.length > 0 || remoteSearchSpaceQueryParametersWithIssue.length > 0)

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

    logger.info(`Fetched ${issuePage.getEdges().length} issues`, 2)
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to fetch issues with labels and column data', 2)
      logger.error(error.stack ?? error.message, 4)
    }

    process.exitCode = 1
    return
  }

  const issues = issuePage.getNodeArray()
  const columnNameSearchResults = await searchIssuesForColumnNames(issues)

  console.log(JSON.stringify(columnNameSearchResults, null, 2))
}

module.exports = main
