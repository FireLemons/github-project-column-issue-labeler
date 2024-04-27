import { GithubAPIClient, IssuePageResponse } from './githubAPIClient'
import { IssueWithChildPages, Label, GraphQLPage } from './githubObjects'
import { Logger } from './logger'

const logger = new Logger()

interface Issue {
  labels: Label
  columnName?: string
}

export class GithubGraphQLPageAssembler {
  githubAPIClient: GithubAPIClient

  constructor (githubAPIClient: GithubAPIClient) {
    this.githubAPIClient = githubAPIClient
  }

  async fetchAllIssues (): Promise<GraphQLPage<IssueWithChildPages>> {
    logger.info('Fetching Issues', 2)
    let cursor
    let issues!: GraphQLPage<IssueWithChildPages>
    let issuePageResponse!: IssuePageResponse

    do {
      try {
        issuePageResponse = await this.githubAPIClient.fetchIssuePage(cursor)

        if (issuePageResponse) {
          const issuePage = new GraphQLPage<IssueWithChildPages>(issuePageResponse.repository?.issues)
          cursor = issuePage.getEndCursor()

          if (!issues) {
            issues = issuePage
          } else {
            issues.appendPage(issuePage)
          }
        }
      } catch (error) {
        if (issuePageResponse.repository) {
          let pageMessageIndex = cursor ? `page with cursor ${cursor}` : 'first page'
          logger.warn('Encountered errors while fetching ' + pageMessageIndex, 2)
        } else {
          throw error
        }
      }
    } while (!(issues.isLastPage()))

    return issues
  }
}