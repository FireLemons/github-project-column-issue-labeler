import { GithubAPIClient, IssuePageResponse } from './githubAPIClient'
import { Issue, GraphQLPage } from './githubObjects'
import { Logger } from './logger'

const logger = new Logger()

export class GithubGraphQLPageAssembler {
  githubAPIClient: GithubAPIClient

  constructor (githubAPIClient: GithubAPIClient) {
    this.githubAPIClient = githubAPIClient
  }

  async fetchAllIssues (): Promise<GraphQLPage<Issue>> {
    logger.addBaseIndentation(2)
    let cursor
    let issues: GraphQLPage<Issue> | undefined
    let issuePageResponse!: IssuePageResponse

    do {
      try {
        issuePageResponse = await this.githubAPIClient.fetchIssuePage(cursor)

        const issuePage = new GraphQLPage<Issue>(issuePageResponse.repository?.issues, Issue)
        cursor = issuePage.getEndCursor()

        if (issues === undefined) {
          issues = issuePage
        } else {
          issues.appendPage(issuePage)
        }
      } catch (error) {
        if (issues === undefined || issues.isEmpty()) {
          throw error
        } else {
          logger.warn('Failed to fetch all issues. Continuing with subset of successfully fetched issues')
          logger.tryWarnLogErrorObject(error, 2)

          issues.disableRemoteDataFetching()

          return issues
        }
      }
    } while (issues?.hasNextPage())

    logger.addBaseIndentation(-2)
    return issues
  }
}
