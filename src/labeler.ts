// Javascript destructuring assignment
import { GithubAPIClient, GraphQLPagePOJO, IssuePOJO } from './githubAPIClient'
import { GithubGraphQLPageAssembler } from './githubGraphQLPageAssembler'
import { GraphQLPage, Issue, ProjectPrimaryKeyHumanReadable, RemoteRecordPageQueryParameters } from './githubObjects'
import { Logger } from './logger'
import ColumnNameFinder from './columnNameFinder'
import { LabelingRule } from './configObjects'

interface columnNameSearchResults {
  issuesWithColumnNames: Issue[]
  issuesWithoutColumnNames: number[]
}

interface remoteSearchSpaceQueryParametersWithIssue {
  issue: Issue
  remoteSearchSpaceQueryParameters: Issue | RemoteRecordPageQueryParameters[]
}[]

interface stats {
  issueCount: number
  issuesWithColumnNamesCount: number
  issuesNotRequiringLabeling: number
  issuesWithFailedLabelings: number
}

export default class Labeler {
  githubAPIClient: GithubAPIClient
  githubGraphQLPageAssembler: GithubGraphQLPageAssembler
  logger: Logger
  stats: stats

  constructor (githubAPIClient: GithubAPIClient, logger: Logger) {
    this.logger = logger
    this.githubAPIClient = githubAPIClient
    this.githubGraphQLPageAssembler = new GithubGraphQLPageAssembler(githubAPIClient)
    this.stats = {
      issueCount: 0,
      issuesWithColumnNamesCount: 0,
      issuesNotRequiringLabeling: 0,
      issuesWithFailedLabelings: 0
    }
  }

  async fetchThenProcessIssuePages (githubAPIClient: GithubAPIClient) {
    let cursor
    let hasNextPage

      do {
        let issuePage: GraphQLPage<Issue>
        let issuePagePOJO: GraphQLPagePOJO<IssuePOJO>

        try {
          issuePagePOJO = (await githubAPIClient.fetchIssuePage(cursor)).repository.issues
        } catch (error) {
          this.logger.warn('Failed to fetch an issue page. No more issue pages will be fetched.')
          this.logger.tryWarnLogErrorObject(error, 2)
          return
        }

        try {
          issuePage = new GraphQLPage<Issue>(issuePagePOJO, Issue)

          cursor = issuePage.getEndCursor()
          hasNextPage = issuePage.hasNextPage()

          this.processIssuePage(issuePage)
        } catch (error) {
          this.logger.warn('Failed to instantiate a graphQL issue page. This page of issues will be skipped.')
          this.logger.tryWarnLogErrorObject(error, 2)

          try {
            const { pageInfo } = issuePagePOJO
            cursor = pageInfo.endCursor
            hasNextPage = pageInfo.hasNextPage
          } catch (error) {
            this.logger.warn('Failed to find parameters needed to fetch next page in issue page data. No more issue pages will be fetched.')
            this.logger.tryWarnLogErrorObject(error, 2)

            return
          }
        }
      } while (hasNextPage)
    githubAPIClient.fetchIssuePage()
  }

  findLabelingRule (columnName: string, projectKey?: ProjectPrimaryKeyHumanReadable) {
    throw new Error('unimplimented')
  }

  isAlreadyLabeled (issue: Issue, labelingRule: LabelingRule) {
    throw new Error('unimplimented')

    const labels = issue.getLabels()
    return true
  }

  async labelIssue (issue: Issue, labels: string[]) {

  }

  async processIssue (issue: Issue) {
    try {
      let additonalRemoteSpaceFetched

      const columnNameFinder = new ColumnNameFinder(this.githubAPIClient, issue)
      const columnNameSearchResult = await columnNameFinder.findColumnNames()
      console.log(issue.getNumber(), columnNameSearchResult)

      if (columnNameSearchResult.length <= 0) {
        if (columnNameFinder.hasDisabledRemoteSearchSpace()) {
          this.logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`)
          this.logger.error('Unable to conduct complete search for column name')
          this.stats.issuesWithFailedLabelings++
        } else {
          this.stats.issuesNotRequiringLabeling++
        }
      } else {
        console.log(`Found column name for issue #${issue.getNumber()}`)
        /* const labelingRule = this.findLabelingRule(columnNameSearchResult)

        if (labelingRule !== undefined && !(this.isAlreadyLabeled(issue, labelingRule))) {
          this.labelIssue(issue, labelingRule)
        }*/
      }
    } catch (error) {
      this.logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`)
      this.logger.tryErrorLogErrorObject(error, 2)

      this.stats.issuesWithFailedLabelings++
      return
    }
  }

  processIssuePage (issuePage: GraphQLPage<Issue>) {
    const issues = issuePage.getNodeArray()

    for(const issue of issues) {
      this.processIssue(issue)
    }
  }

  async labelIssues () {
    let issuePage: GraphQLPage<Issue>

    try {
      this.logger.info('Fetching issues with labels and column data...')
      issuePage = await this.githubGraphQLPageAssembler.fetchAllIssues()

      this.logger.info(`Fetched ${issuePage.getEdges().length} issues`, 2)
    } catch (error) {
      this.logger.error('Failed to fetch issues with labels and column data', 2)
      this.logger.tryErrorLogErrorObject(error, 4)

      process.exitCode = 1
      return
    }

    this.processIssuePage(issuePage)
  }
}
