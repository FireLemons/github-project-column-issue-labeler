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
    logger.info('Fetching Issues')
    let cursor
    let issues!: GraphQLPage<Issue>
    let issuePageResponse!: IssuePageResponse

    do {
      try {
        issuePageResponse = await this.githubAPIClient.fetchIssuePage(cursor)

        if (issuePageResponse) {
          const issuePage = new GraphQLPage<Issue>(issuePageResponse.repository?.issues, Issue)
          cursor = issuePage.getEndCursor()

          if (!issues) {
            issues = issuePage
          } else {
            issues.appendPage(issuePage)
          }
        }
      } catch (error) {
        if (issuePageResponse?.repository) {
          let pageMessageIndex = cursor ? `page with cursor ${cursor}` : 'first page'
          logger.warn('Encountered errors while fetching ' + pageMessageIndex)
        } else {
          throw error
        }
      }
    } while (!(issues.isLastPage()))

    logger.addBaseIndentation(-2)
    return issues
  }
}
