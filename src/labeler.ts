// Javascript destructuring assignment
import { GithubAPIClient, GraphQLPagePOJO, IssuePOJO } from './githubAPIClient'
import { GraphQLPage, Issue } from './githubObjects'
import { Logger } from './logger'
import { Config, LabelingRuleContainer } from './config'
import LabelResolver from './labelResolver'
import * as TypeChecker from './typeChecker'

interface Stats {
  issueCount: number
  issuesWithColumnNamesCount: number
  issuesNotRequiringLabeling: number
  issuesWithFailedLabelings: number
}

export default class Labeler {
  #githubAPIClient: GithubAPIClient
  #logger: Logger
  #labelingRules: LabelingRuleContainer
  #labelResolver: LabelResolver
  #stats: Stats

  constructor (githubAPIClient: GithubAPIClient, logger: Logger, config: Config) {
    this.#githubAPIClient = githubAPIClient
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
    await this.#processIssuePages()
  }

  async #fetchIssuePage (cursor?: string | null): Promise<GraphQLPagePOJO<IssuePOJO> | null> {
    try {
      return (await this.#githubAPIClient.fetchIssuePage(cursor)).repository.issues
    } catch (error) {
      this.#logger.warn('Failed to fetch an issue page. No more issue pages will be fetched.')
      this.#logger.tryWarnLogErrorObject(error, 2)
      return null
    }
  }

  #instantiateIssuePage (issuePagePOJO: GraphQLPagePOJO<IssuePOJO>): GraphQLPage<Issue> | null {
    try {
      const issuePage = new GraphQLPage<Issue>(issuePagePOJO, Issue)

      return issuePage
    } catch (error) {
      this.#logger.warn('Failed to instantiate a graphQL issue page. This page of issues will be skipped.')
      this.#logger.tryWarnLogErrorObject(error, 2)

      return null
    }
  }

  async #processIssuePages () {
    let cursor
    let hasNextPage

    do {
      this.#logger.info('Fetching issue page...')
      const issuePagePOJO = await this.#fetchIssuePage(cursor)

      if (issuePagePOJO === null) {
        return
      }

      const issuePage = this.#instantiateIssuePage(issuePagePOJO)

      if (issuePage instanceof GraphQLPage) {
        this.#logger.info(`Fetched page containing ${issuePage.getEdges().length} issues`, 2)
        cursor = issuePage.getEndCursor()
        hasNextPage = issuePage.hasNextPage()

        this.#processIssuePage(issuePage)
      } else {
        const pageInfo = this.#recoverPaginationDataFromPOJO(issuePagePOJO)

        if (pageInfo === null) {
          this.#logger.warn('Failed to find parameters needed to fetch next page in issue page data. No more issue pages will be fetched.')
          return
        }

        cursor = pageInfo.cursor
        hasNextPage = pageInfo.hasNextPage
      }
    } while (hasNextPage)
  }

  async #processIssue (issue: Issue) {
    try {
      this.#labelResolver.getLabelDiff(issue)
    } catch (error) {
      this.#logger.error(`Failed to find column name of issue #${issue.getNumber()}. Skipping issue.`)
      this.#logger.tryErrorLogErrorObject(error, 2)

      this.#stats.issuesWithFailedLabelings++
      return
    }
  }

  #processIssuePage (issuePage: GraphQLPage<Issue>) {
    this.#logger.addBaseIndentation(2)
    this.#logger.info('Processing issue page')
    const issues = issuePage.getNodeArray()

    for(const issue of issues) {
      this.#processIssue(issue)
    }
    this.#logger.addBaseIndentation(-2)
  }

  #recoverPaginationDataFromPOJO (issuePOJO: any): { cursor: string, hasNextPage: boolean } | null  {
    if (issuePOJO?.pageInfo !== undefined) {
      const { pageInfo } = issuePOJO

      if (TypeChecker.isString(pageInfo.endCursor) && TypeChecker.isBoolean(pageInfo.hasNextPage)) {
        return {
          cursor: pageInfo.endCursor,
          hasNextPage: pageInfo.hasNextPage
        }
      }
    }

    return null
  }
}
