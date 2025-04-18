import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { GithubAPIClient, IssuePageResponse } from '../../src/githubAPIClient'
import { Logger } from '../../src/logger'
import { Config } from '../../src/config'

const logger = new Logger()
const requestResponseDir = '../temp/request_responses'

async function loadConfig (): Promise<string> {
  const configContents = await readFile('./config.json')

  return configContents.toString()
}

async function ensureResponseDirectoryExists (): Promise<void> {
  await mkdir(requestResponseDir, { recursive: true })
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
    logger.tryErrorLogErrorObject(error, 4)

    process.exitCode = 1
    return
  }

  const config = new Config(configFileContents, logger)

  if (config === null) {
    return
  }

  let githubAPIClient: GithubAPIClient

  try {
    logger.info('Initializing github API client')

    githubAPIClient = new GithubAPIClient(config.getAPIToken(), config.getRepoName(), config.getRepoOwnerName())

    logger.info('Initialized github API client')
  } catch (error) {
    logger.error('Failed to initialize github API client', 2)
    logger.tryErrorLogErrorObject(error, 4)

    process.exitCode = 1
    return
  }

  let issueId: string
  let issueNumber: number
  let issuePage: IssuePageResponse

  try {
    logger.info('Fetching issue page')
    issuePage = await githubAPIClient.fetchIssuePage()

    await writeStringToFile(issuePage, 'issue_page')
    const issue = issuePage.repository.issues.edges[0]?.node
    issueId = issue.id
    issueNumber = issue.number

    logger.info('Fetched issue page', 2)
  } catch (error) {
    logger.error('Failed to fetch issue page', 2)
    logger.tryErrorLogErrorObject(error, 4)

    process.exitCode = 1
    return
  }

  try {
    logger.info('Fetching expanded column name search space for issue')
    const issueWithExpandedColumnNameSearchSpace = await githubAPIClient.fetchExpandedColumnNameSearchSpace(issueId)

    await writeStringToFile(issueWithExpandedColumnNameSearchSpace, 'issue_with_expanded_column_name_search_space')

    logger.info('Fetched expanded column name search space for issue', 2)
  } catch (error) {
    logger.error('Failed to fetch expanded column name search space for issue', 2)
    logger.tryErrorLogErrorObject(error, 4)
  }

  try {
    logger.info(`Fetching project item page of issue #${issueNumber}`)
    const projectItemPageOfIssue = await githubAPIClient.fetchProjectItemPage(issueId)

    await writeStringToFile(projectItemPageOfIssue, 'project_item_page')

    logger.info('Fetched project item page', 2)
  } catch (error) {
    logger.error('Failed to fetch project item page', 2)
    logger.tryErrorLogErrorObject(error, 4)
  }

  logger.info('Searching for project item id')
  const projectItemId = issuePage.repository.issues.edges.find((issueEdge) => {
    return issueEdge.node.projectItems.edges.length >= 1
  })?.node.projectItems.edges[0].node.id

  if (projectItemId) {
    logger.addBaseIndentation(2)
    logger.info('Found project item id')
    logger.info('Using project item id for field value page request')
    let fieldValuePage

    try {
      logger.info('Fetching field value page')
      fieldValuePage = await githubAPIClient.fetchFieldValuePage(projectItemId)

      await writeStringToFile(fieldValuePage, 'field_value_page')

      logger.info('Fetched field value page', 2)
    } catch (error) {
      logger.error('Failed to fetch field value page', 2)
      logger.tryErrorLogErrorObject(error, 4)
    }

    logger.addBaseIndentation(-2)
  } else {
    logger.warn('Failed to find project item id. Skipping field value page response.', 2)
  }

  try {
    logger.info(`Fetching label page of issue #${issueNumber}`)
    const labelPageOfIssue = await githubAPIClient.fetchLabelPage(issueId)

    await writeStringToFile(labelPageOfIssue, 'label_page')

    logger.info('Fetched label page', 2)
  } catch (error) {
    logger.error('Failed to fetch label page', 2)
    logger.tryErrorLogErrorObject(error, 4)
  }
}

main()
