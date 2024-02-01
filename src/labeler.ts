import * as core from '@actions/core'
import validateConfig from './validateConfig'
import * as github from '@actions/github'
import * as githubActionsPrettyPrintLogger from './githubActionsPrettyPrintLogger'

let columns_label_config: string = core.getInput('column_label_config')
const token = core.getInput('token')
// Javascript destructuring assignment
const {owner, repo} = github.context.repo
const Octokit = github.getOctokit(token)
const LABEL_PAGE_SIZE = 20
const ISSUE_PAGE_SIZE = 150

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
}

module.exports = main