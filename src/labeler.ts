import fs from 'fs'
import { GithubAPIClient } from './githubAPIClient'
import * as Logger from './logger'
// Javascript destructuring assignment
import { Octokit, App } from 'octokit'
import validateConfig from './validateConfig'

const fsPromises = fs.promises

async function loadConfig(): Promise<string> {
  const configContents = await fsPromises.readFile('./config.json')

  return "" + configContents
}

async function main() {
  let configFileContents

  try {
    Logger.info('Loading Config')
    configFileContents = await loadConfig()
  } catch (error) {
    Logger.error('Failed to load config', 2)
    if (error instanceof Error) {
      Logger.error(error.message, 4)
    }

    return
  }

  let config

  try {
    Logger.info('Validating Config')
    config = validateConfig(configFileContents)

    if (!(config['column-label-config'].length)) {
      Logger.error('Could not find any valid actions to perform from the configuration')
      process.exitCode = 1
      return
    }

    Logger.info('Validated Config:')
    Logger.info(JSON.stringify(config, null, 2))
  } catch (error) {
    if (error instanceof Error && error.message) {
      Logger.error('Failed to validate config')
      Logger.error(error.message)
      process.exitCode = 1
    }

    return
  }

  let githubAPIClient

  try {
    githubAPIClient = new GithubAPIClient(config['access-token'], config.repo, config.owner)
  } catch (error) {
    if (error instanceof Error && error.message) {
      Logger.error('Failed to initialize github API client', 2)
      Logger.error(error.message, 4)
      process.exitCode = 1
    }

    return
  }

  try {
      Logger.info('Fetching issues with labels and associated column data...')
      githubAPIClient.fetchIssuePage()
      .then(
        (response) => {
          Logger.info('Fetched issues with labels and associated column data', 2)
          Logger.info(JSON.stringify(response, null, 2), 4)
        }
      )
      .catch(
        (error) => {
          Logger.error('Encountered errors after fetching issues with labels and associated column data', 2)
          if(error instanceof Error) {
            Logger.error(error.message, 4)
          } else {
            Logger.error(error, 4)
          }
        }
      )
    } catch (error) {
      if (error instanceof Error && error.message) {
        Logger.error('Failed to fetch issues with labels and associated column data', 2)
        Logger.error(error.message, 4)
        process.exitCode = 1
      }

      return
    }
  }

module.exports = main