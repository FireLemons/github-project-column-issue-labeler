import fs from 'fs'
import { GithubAPIClient } from './githubAPIClient'
import { GithubGraphQLPageAssembler } from './githubGraphQLPageAssembler'
import { Logger } from './logger'
// Javascript destructuring assignment
import { Octokit, App } from 'octokit'
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
      logger.error(error.message, 4)
    }

    return
  }

  let config

  try {
    logger.info('Validating Config')
    config = validateConfig(configFileContents)

    if (!(config.columns.length)) {
      logger.error('Could not find any valid actions to perform from the configuration')
      process.exitCode = 1

      return
    }

    logger.info('Validated Config:')
    logger.info(JSON.stringify(config, null, 2))
  } catch (error) {
    if (error instanceof Error && error.message) {
      logger.error('Failed to validate config')
      logger.error(error.message, 2)
      process.exitCode = 1
    }

    return
  }

  let githubAPIClient
  let githubGraphQLPageAssembler

  try {
    logger.info('Initializing github API accessors')
    githubAPIClient = new GithubAPIClient(config.accessToken, config.repo, config.owner)
    githubGraphQLPageAssembler = new GithubGraphQLPageAssembler(githubAPIClient)
  } catch (error) {
    if (error instanceof Error && error.message) {
      logger.error('Failed to initialize github API accessors', 2)
      logger.error(error.message, 4)
      process.exitCode = 1
    }

    return
  }

  logger.info('Initialized github API accessors')

  try {
      logger.info('Fetching issues with labels and associated column data...')
      githubGraphQLPageAssembler.fetchAllIssues()
      .then(
        (response) => {
          logger.info('Fetched issues with labels and associated column data', 2)
          logger.info(JSON.stringify(response, null, 2), 4)
        }
      )
      .catch(
        (error) => {
          logger.error('Encountered errors after fetching issues with labels and associated column data', 2)
          if(error instanceof Error) {
            logger.error(error.message, 4)
          } else {
            logger.error(error, 4)
          }
        }
      )
    } catch (error) {
      if (error instanceof Error && error.message) {
        logger.error('Failed to fetch issues with labels and associated column data', 2)
        logger.error(error.message, 4)
        process.exitCode = 1
      }

      return
    }
  }

module.exports = main