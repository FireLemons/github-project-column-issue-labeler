import { FieldValuePageNodePOJO, GithubAPIClient, GraphQLPagePOJO, IssuePageResponse, LabelPOJO } from './githubAPIClient'
import { Issue, GraphQLPage, RemoteRecordPageQueryParameters, FieldValue, Label, ProjectItem, GraphQLPageMergeable } from './githubObjects'
import { Logger } from './logger'

const logger = new Logger()

export class GithubGraphQLPageAssembler {
  githubAPIClient: GithubAPIClient

  constructor (githubAPIClient: GithubAPIClient) {
    this.githubAPIClient = githubAPIClient
  }

  async fetchAdditionalSearchSpace (queryParams: Issue | RemoteRecordPageQueryParameters) {
    if (queryParams instanceof Issue) {
      await this.#expandIssueSearchSpace(queryParams)
    } else {
      await this.#expandPage(queryParams.localPage, queryParams.parentId)
    }
  }

  async fetchAllIssues (): Promise<GraphQLPage<Issue>> {
    logger.addBaseIndentation(2)
    logger.info('Fetching Issues')
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

          if (error instanceof Error) {
            logger.warn(error.stack ?? error.message, 2)
          }

          issues.disableRemoteDataFetching()

          return issues
        }

      }
    } while (!(issues?.isLastPage()))

    logger.addBaseIndentation(-2)
    return issues
  }

  async #expandPage (page: GraphQLPage<FieldValue> | GraphQLPage<Label> | GraphQLPageMergeable<ProjectItem>, parentId: string) {
    const PageNodeClass = page.lookupNodeClass()
    const endCursor = page.getEndCursor()

    switch (PageNodeClass) {
      case FieldValue:
        const fieldValuePagePOJO: GraphQLPagePOJO<FieldValuePageNodePOJO> = (await this.githubAPIClient.fetchFieldValuePage(parentId)).node.fieldValues;
        (page as GraphQLPage<FieldValue>).appendPage(new GraphQLPage<FieldValue>(fieldValuePagePOJO, FieldValue))
        break
      case Label:
        const labelPagePOJO = (await this.githubAPIClient.fetchLabelPage(parentId)).node.labels;
        (page as GraphQLPage<Label>).appendPage(new GraphQLPage<Label>(labelPagePOJO, Label))
        break
      case ProjectItem:
        const projectItemPagePOJO = (await this.githubAPIClient.fetchProjectItemPage(parentId)).node.projectItems;
        (page as GraphQLPageMergeable<ProjectItem>).appendPage(new GraphQLPageMergeable<ProjectItem>(projectItemPagePOJO, ProjectItem))
        break
    }
  }

  async #expandIssueSearchSpace (issue: Issue) {
    const expandedColumnNameSearchSpacePOJO = (await this.githubAPIClient.fetchExpandedColumnNameSearchSpace(issue.getId())).node.projectItems
    const expandedColumnNameSearchSpace = new GraphQLPageMergeable<ProjectItem>(expandedColumnNameSearchSpacePOJO, ProjectItem)

    issue.getProjectItemPage().merge(expandedColumnNameSearchSpace)
  }
}
