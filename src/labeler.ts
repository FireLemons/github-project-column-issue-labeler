import fs from 'fs'
// Javascript destructuring assignment
import { GithubAPIClient } from './githubAPIClient'
import { GithubGraphQLPageAssembler } from './githubGraphQLPageAssembler'
import { Logger } from './logger'
import { validateConfig } from './validateConfig'

const fsPromises = fs.promises
const logger = new Logger()

async function loadConfig(): Promise<string> {
  const configContents = await fsPromises.readFile('./config.json')

  return "" + configContents
}

async function main() {
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

  let config

  try {
    logger.info('Validating Config')
    config = validateConfig(configFileContents)

    if ('projects' in config) {
      if (!(config.projects!.length)) {
        logger.error('Config does not contain any valid projects')
        process.exitCode = 1

        return
      }
    } else {
      if (!(config.columns!.length)) {
        logger.error('Config does not contain any valid columns')
        process.exitCode = 1

        return
      }
    }

    logger.info('Validated Config:')
    logger.info(JSON.stringify(config, null, 2))
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to validate config')
      logger.error(error.stack ?? error.message, 2)
      process.exitCode = 1
    }

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
  let issuePage

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

  for(let i = issues.length - 1; i >= 0; i--) {
    const issue = issues[i]
    const columnNameSearchResult = issue.findColumnName()
  }
}

module.exports = main
