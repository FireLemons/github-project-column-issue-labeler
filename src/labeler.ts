// Javascript destructuring assignment
import { GithubAPIClient, GraphQLPagePOJO, IssuePOJO } from './githubAPIClient'
import { GithubGraphQLPageAssembler } from './githubGraphQLPageAssembler'
import { GraphQLPage, GraphQLPageMergeable, Issue, ProjectItem, ProjectPrimaryKeyHumanReadable, RemoteRecordPageQueryParameters } from './githubObjects'
import { Logger } from './logger'
import * as TypeChecker from './typeChecker'
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

  async addRemoteSearchSpace (issue: Issue, remoteSearchSpaceQueryParameters?: RemoteRecordPageQueryParameters) {
    if (remoteSearchSpaceQueryParameters) {
      const expandedColumnNameSearchSpacePOJO = (await this.githubAPIClient.fetchExpandedColumnNameSearchSpace(issue.getId())).node.projectItems
      const expandedColumnNameSearchSpace = new GraphQLPageMergeable<ProjectItem>(expandedColumnNameSearchSpacePOJO, ProjectItem)

      issue.applyExpandedSearchSpace(expandedColumnNameSearchSpace)
    } else {

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

      do {
        const columnNameSearchResult = issue.findColumnName()
        additonalRemoteSpaceFetched = false

        if (columnNameSearchResult === null) {
          if (issue.hasInaccessibleRemoteSearchSpace()) {
            this.logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`)
            this.logger.error('Failed to find column name using available search space and could not fetch all column name search space')
            this.stats.issuesWithFailedLabelings++
          } else {
            this.stats.issuesNotRequiringLabeling++
          }
        } else if (TypeChecker.isString(columnNameSearchResult)) {
          const labelingRule = this.findLabelingRule(columnNameSearchResult)

          if (labelingRule !== undefined && !(this.isAlreadyLabeled(issue, labelingRule))) {
            this.labelIssue(issue, labelingRule)
          }
        } else {
          await this.addRemoteSearchSpace(issue, columnNameSearchResult)
          additonalRemoteSpaceFetched = true
        }
      } while (additonalRemoteSpaceFetched)
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

  searchLocalSearchSpaceForColumnNames (issues: Issue[]) {
    const remoteSearchSpaceQueryParametersWithIssue: remoteSearchSpaceQueryParametersWithIssue[] = []
    const issuesWithColumnNames: Issue[] = []

    while(issues.length > 0) {
      const issue = issues.pop()!

      try {
        const columnNameSearchResult = issue.findColumnName()
        if (columnNameSearchResult === null) {
          if (issue.hasInaccessibleRemoteSearchSpace()) {
            this.logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`)
            this.logger.error('Failed to find column name using available search space and could not fetch all column name search space')
            this.stats.issuesWithFailedLabelings++
          } else {
            this.stats.issuesNotRequiringLabeling++
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
        this.logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`)
        this.logger.tryErrorLogErrorObject(error, 2)

        this.stats.issuesWithFailedLabelings++
      }
    }

    return {
      issuesWithColumnNames,
      remoteSearchSpaceQueryParametersWithIssue
    }
  }

  async fetchRemoteSearchSpace (remoteSearchSpaceQueryParametersWithIssue: remoteSearchSpaceQueryParametersWithIssue[]): Promise<Issue[]> {
    const issuesWithNewlyFetchedSearchSpace: Issue[] = []

    while(remoteSearchSpaceQueryParametersWithIssue.length > 0) {
      const { issue, remoteSearchSpaceQueryParameters } = remoteSearchSpaceQueryParametersWithIssue.pop()!
      if (remoteSearchSpaceQueryParameters instanceof Issue) {
        try {
          await this.githubGraphQLPageAssembler.fetchAdditionalSearchSpace(remoteSearchSpaceQueryParameters)
          issuesWithNewlyFetchedSearchSpace.push(issue)
        } catch (error) {
          issue.disableColumnNameRemoteSearchSpace()

          this.logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`)
          this.logger.error('Failed to find column name using available search space and could not fetch all column name search space')
          this.logger.tryErrorLogErrorObject(error, 2)
        }
      } else {
        let failedSearchCount = 0//replace with error list

        for (const singleQueryParameters of remoteSearchSpaceQueryParameters) {
          try {
            await this.githubGraphQLPageAssembler.fetchAdditionalSearchSpace(singleQueryParameters)
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
          this.logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`)
          this.logger.error('Failed to find column name using available search space and could not fetch all column name search space')
        }
      }
    }

    return issuesWithNewlyFetchedSearchSpace
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

    const issues = issuePage.getNodeArray()

    this.logger.info('Searching for column names of issues')
    let issuesToBeSearched = issues.slice(0)

    do {
      const {issuesWithColumnNames, remoteSearchSpaceQueryParametersWithIssue} = this.searchLocalSearchSpaceForColumnNames(issuesToBeSearched)
      console.log(JSON.stringify(issuesWithColumnNames.map((issue) => { return issue.getNumber() }), null, 2))

      issuesToBeSearched = await this.fetchRemoteSearchSpace(remoteSearchSpaceQueryParametersWithIssue)
    } while (issuesToBeSearched.length > 0)
  }
}
