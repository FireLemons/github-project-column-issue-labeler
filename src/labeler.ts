// Javascript destructuring assignment
import { GithubAPIClient, GraphQLPagePOJO, IssuePOJO } from './githubAPIClient'
import { GithubGraphQLPageAssembler } from './githubGraphQLPageAssembler'
import { GraphQLPage, Issue, ProjectPrimaryKeyHumanReadable } from './githubObjects'
import { Logger } from './logger'
import { Config, LabelingAction, LabelingRuleContainer } from './config'
import LabelResolver from './labelResolver'

interface Stats {
  issueCount: number
  issuesWithColumnNamesCount: number
  issuesNotRequiringLabeling: number
  issuesWithFailedLabelings: number
}

export default class Labeler {
  #githubAPIClient: GithubAPIClient
  #githubGraphQLPageAssembler: GithubGraphQLPageAssembler
  #logger: Logger
  #labelingRules: LabelingRuleContainer
  #labelResolver: LabelResolver
  #stats: Stats

  constructor (githubAPIClient: GithubAPIClient, logger: Logger, config: Config) {
    this.#githubAPIClient = githubAPIClient
    this.#githubGraphQLPageAssembler = new GithubGraphQLPageAssembler(githubAPIClient)
    this.#logger = logger
    this.#labelingRules = config.getLabelingRules()
    this.#labelResolver = new LabelResolver(githubAPIClient, config)
    this.#stats = {
      issueCount: 0,
      issuesWithColumnNamesCount: 0,
      issuesNotRequiringLabeling: 0,
      issuesWithFailedLabelings: 0
    }
  }

  async labelIssues () {
    let issuePage: GraphQLPage<Issue>

    try {
      this.#logger.info('Fetching issues with labels and column data...')
      issuePage = await this.#githubGraphQLPageAssembler.fetchAllIssues()

      this.#logger.info(`Fetched ${issuePage.getEdges().length} issues`, 2)
    } catch (error) {
      this.#logger.error('Failed to fetch issues with labels and column data', 2)
      this.#logger.tryErrorLogErrorObject(error, 4)

      process.exitCode = 1
      return
    }

    this.processIssuePage(issuePage)
  }

  async #fetchThenProcessIssuePages (githubAPIClient: GithubAPIClient) {
    let cursor
    let hasNextPage

      do {
        let issuePage: GraphQLPage<Issue>
        let issuePagePOJO: GraphQLPagePOJO<IssuePOJO>

        try {
          issuePagePOJO = (await githubAPIClient.fetchIssuePage(cursor)).repository.issues
        } catch (error) {
          this.#logger.warn('Failed to fetch an issue page. No more issue pages will be fetched.')
          this.#logger.tryWarnLogErrorObject(error, 2)
          return
        }

        try {
          issuePage = new GraphQLPage<Issue>(issuePagePOJO, Issue)

          cursor = issuePage.getEndCursor()
          hasNextPage = issuePage.hasNextPage()

          this.processIssuePage(issuePage)
        } catch (error) {
          this.#logger.warn('Failed to instantiate a graphQL issue page. This page of issues will be skipped.')
          this.#logger.tryWarnLogErrorObject(error, 2)

          try {
            const { pageInfo } = issuePagePOJO
            cursor = pageInfo.endCursor
            hasNextPage = pageInfo.hasNextPage
          } catch (error) {
            this.#logger.warn('Failed to find parameters needed to fetch next page in issue page data. No more issue pages will be fetched.')
            this.#logger.tryWarnLogErrorObject(error, 2)

            return
          }
        }
      } while (hasNextPage)
    githubAPIClient.fetchIssuePage()
  }

  async processIssue (issue: Issue) {
    try {
      this.#labelResolver.getLabelDiff(issue)
    } catch (error) {
      this.#logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`)
      this.#logger.tryErrorLogErrorObject(error, 2)

      this.#stats.issuesWithFailedLabelings++
      return
    }
  }

  processIssuePage (issuePage: GraphQLPage<Issue>) {
    const issues = issuePage.getNodeArray()

    for(const issue of issues) {
      this.processIssue(issue)
    }
  }
}
