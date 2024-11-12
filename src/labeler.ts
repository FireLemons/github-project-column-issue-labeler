// Javascript destructuring assignment
import { GithubAPIClient } from './githubAPIClient'
import { GithubGraphQLPageAssembler } from './githubGraphQLPageAssembler'
import { GraphQLPage, Issue, RemoteRecordPageQueryParameters } from './githubObjects'
import { Logger } from './logger'
import { readFile } from 'node:fs/promises'
import * as TypeChecker from './typeChecker'
import { validateConfig } from './validateConfig'

interface columnNameSearchResults {
  issuesWithColumnNames: Issue[]
  issuesWithoutColumnNames: number[]
}

interface remoteSearchSpaceQueryParametersWithIssue {
  issue: Issue
  remoteSearchSpaceQueryParameters: Issue | RemoteRecordPageQueryParameters[]
}[]

const logger = new Logger()
const stats = {
  issueCount: 0,
  issuesWithColumnNamesCount: 0,
  issuesWithoutColumnNamesCount: 0,
  issuesWithFailedLabelings: 0
}
let githubGraphQLPageAssembler: GithubGraphQLPageAssembler

async function loadConfig (): Promise<string> {
  const configContents = await readFile('./config.json')

  return '' + configContents
}

function searchLocalSearchSpaceForColumnNames (issues: Issue[]) {
  const remoteSearchSpaceQueryParametersWithIssue: remoteSearchSpaceQueryParametersWithIssue[] = []
  const issuesWithColumnNames: Issue[] = []

  while(issues.length > 0) {
    const issue = issues.pop()!

    try {
      const columnNameSearchResult = issue.findColumnName()
      if (columnNameSearchResult === null) {
        if (issue.hasInaccessibleRemoteSearchSpace()) {
          logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`)
          logger.error('Failed to find column name using available search space and could not fetch all column name search space')
          stats.issuesWithFailedLabelings++
        } else {
          stats.issuesWithoutColumnNamesCount++
        }
      } else if (TypeChecker.isString(columnNameSearchResult)) {
        issuesWithColumnNames.push(issue)
      } else {
        remoteSearchSpaceQueryParametersWithIssue.push({
          issue: issue,
          remoteSearchSpaceQueryParameters: columnNameSearchResult
        })
      }
    } catch (error) {
      logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`)
      logger.tryErrorLogErrorObject(error, 2)

      stats.issuesWithFailedLabelings++
    }
  }

  return {
    issuesWithColumnNames,
    remoteSearchSpaceQueryParametersWithIssue
  }
}

async function fetchRemoteSearchSpace (remoteSearchSpaceQueryParametersWithIssue: remoteSearchSpaceQueryParametersWithIssue[]): Promise<Issue[]> {
  const issuesWithNewlyFetchedSearchSpace: Issue[] = []

  while(remoteSearchSpaceQueryParametersWithIssue.length > 0) {
    const { issue, remoteSearchSpaceQueryParameters } = remoteSearchSpaceQueryParametersWithIssue.pop()!
    if (remoteSearchSpaceQueryParameters instanceof Issue) {
      try {
        await githubGraphQLPageAssembler.fetchAdditionalSearchSpace(remoteSearchSpaceQueryParameters)
        issuesWithNewlyFetchedSearchSpace.push(issue)
      } catch (error) {
        issue.disableColumnNameRemoteSearchSpace()

        logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`)
        logger.error('Failed to find column name using available search space and could not fetch all column name search space')
        logger.tryErrorLogErrorObject(error, 2)
      }
    } else {
      let failedSearchCount = 0//replace with error list

      for (const singleQueryParameters of remoteSearchSpaceQueryParameters) {
        try {
          await githubGraphQLPageAssembler.fetchAdditionalSearchSpace(singleQueryParameters)
        } catch (error) {
          failedSearchCount++
        }
      }

      if (failedSearchCount > 0) {
        issue.markRemoteSearchSpaceAsNotCompletelyAcessible()
      }

      if (failedSearchCount !== remoteSearchSpaceQueryParameters.length) {
        issuesWithNewlyFetchedSearchSpace.push(issue)
      } else {
        logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`)
        logger.error('Failed to find column name using available search space and could not fetch all column name search space')
      }
    }
  }

  return issuesWithNewlyFetchedSearchSpace
}

async function main () {
  let configFileContents

  try {
    logger.info('Loading Config')
    configFileContents = await loadConfig()
  } catch (error) {
    logger.error('Failed to load config', 2)
    logger.tryErrorLogErrorObject(error, 4)

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
    logger.error('Failed to initialize github API objects', 2)
    logger.tryErrorLogErrorObject(error, 4)

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
    logger.error('Failed to fetch issues with labels and column data', 2)
    logger.tryErrorLogErrorObject(error, 4)

    process.exitCode = 1
    return
  }

  const issues = issuePage.getNodeArray()

  logger.info('Searching for column names of issues')
  let issuesToBeSearched = issues.slice(0)

  do {
    const {issuesWithColumnNames, remoteSearchSpaceQueryParametersWithIssue} = searchLocalSearchSpaceForColumnNames(issuesToBeSearched)
    console.log(JSON.stringify(issuesWithColumnNames.map((issue) => { return issue.getNumber() }), null, 2))

    issuesToBeSearched = await fetchRemoteSearchSpace(remoteSearchSpaceQueryParametersWithIssue)
  } while (issuesToBeSearched.length > 0)
}

module.exports = main
