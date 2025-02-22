import { GithubAPIClient } from './src/githubAPIClient'
import { GithubGraphQLPageAssembler } from './src/githubGraphQLPageAssembler'
import { Logger } from './src/logger'
import { readFile } from 'node:fs/promises'
import { Config } from './src/config'
import Labeler from './src/labeler'

async function loadConfig (): Promise<string> {
  const configContents = await readFile('./config.json')

  return '' + configContents
}

async function main () {
  const logger = new Logger()

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

  const config = new Config(configFileContents, logger)

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
    logger.error('Failed to initialize github API objects', 2)
    logger.tryErrorLogErrorObject(error, 4)

    process.exitCode = 1
    return
  }

  logger.info('Initialized github API client')

  const labeler = new Labeler(githubAPIClient, logger, (config.columns ?? config.projects)!)

  labeler.labelIssues()
}

main()