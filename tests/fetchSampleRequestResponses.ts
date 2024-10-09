import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { GithubAPIClient, IssuePageResponse } from '../src/githubAPIClient'
import { Logger } from '../src/logger'
import { validateConfig } from '../src/validateConfig'

const logger = new Logger()
const requestResponseDir = './temp/request_responses'

async function loadConfig (): Promise<string> {
  const configContents = await readFile('./config.json')

  return '' + configContents
}

async function ensureResponseDirectoryExists (): Promise<void> {
  mkdir(requestResponseDir, { recursive: true })
}

async function writeStringToFile (fileContents: object, fileName: string) {
  const fileContentsAsString = JSON.stringify(fileContents, null, 2)

  await writeFile(`${requestResponseDir}/${fileName}.json`, fileContentsAsString)
}

async function main () {
  await ensureResponseDirectoryExists()

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
    return
  }

  let githubAPIClient: GithubAPIClient

  try {
    logger.info('Initializing github API client')

    githubAPIClient = new GithubAPIClient(config.accessToken, config.repo.name, config.repo.ownerName)

    logger.info('Initialized github API client')
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to initialize github API client', 2)
      logger.error(error.stack ?? error.message, 4)
    }

    process.exitCode = 1
    return
  }

  let issuePage: IssuePageResponse
  let issueNumber: number

  try {
    logger.info('Fetching issue page')
    issuePage = await githubAPIClient.fetchIssuePage()

    writeStringToFile(issuePage, 'issue_page')
    issueNumber = issuePage.repository.issues.edges[0]?.node.number

    logger.info('Fetched issue page', 2)
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to fetch issue page', 2)
      logger.error(error.stack ?? error.message, 4)
    }

    process.exitCode = 1
    return
  }

  let issueWithExpandedColumnNameSearchSpace

  try {
    logger.info('Fetching expanded column name search space for issue')
    issueWithExpandedColumnNameSearchSpace = await githubAPIClient.fetchExpandedColumnNameSearchSpace(issueNumber)

    writeStringToFile(issueWithExpandedColumnNameSearchSpace, 'issue_with_expanded_column_name_search_space')

    logger.info('Fetched expanded column name search space for issue', 2)
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to fetch expanded column name search space for issue', 2)
      logger.error(error.stack ?? error.message, 4)
    }
  }

  let fieldValuePage

  try {
    logger.info('Fetching field value page')
    fieldValuePage = await githubAPIClient.fetchFieldValuePage()

    writeStringToFile(fieldValuePage, 'field_value_page')

    logger.info('Fetched field value page', 2)
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to fetch field value page', 2)
      logger.error(error.stack ?? error.message, 4)
    }
  }

  let labelPageOfIssue

  try {
    logger.info(`Fetching label page of issue #${issueNumber}`)
    labelPageOfIssue = await githubAPIClient.fetchIssueLabelPage(issueNumber)

    writeStringToFile(labelPageOfIssue, 'label_page')

    logger.info('Fetched label page', 2)
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to fetch label page', 2)
      logger.error(error.stack ?? error.message, 4)
    }
  }
}

main()