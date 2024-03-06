import { GithubAPIClient, IssuePageResponse } from './githubAPIClient'
import { IssueWithChildPages, Label, GraphQLPage } from './githubObjects'
import * as Logger from './logger'

interface Issue {
  labels: Label
  columnName?: string
}

export class GithubDataFetcher {
  githubAPIClient: GithubAPIClient

  constructor (githubAPIClient: GithubAPIClient) {
    this.githubAPIClient = githubAPIClient
  }

  async fetchAllIssues (): Promise<GraphQLPage<IssueWithChildPages>> {
    Logger.info('Fetching Issues', 2)
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
          Logger.warn('Encountered errors while fetching ' + pageMessageIndex, 2)
        } else {
          throw error
        }
      }
    } while (!(issues.isLastPage()))

    return issues
  }
}