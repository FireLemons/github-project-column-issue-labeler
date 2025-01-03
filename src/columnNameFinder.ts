import { FieldValue, GraphQLPage, GraphQLPageMergeable, Issue, ProjectItem, ProjectPrimaryKeyHumanReadable } from './githubObjects'
import { GithubAPIClient } from './githubAPIClient'

export enum RemoteSearchSpaceType {
  EXPANDED_SEARCH_SPACE = 'EXPANDED_SEARCH_SPACE',
  FIELD_VALUE_PAGE = 'FIELD_VALUE_PAGE',
  PROJECT_ITEM_PAGE = 'PROJECT_ITEM_PAGE',
  UNDEFINED = 'UNDEFINED'
}

interface RemoteRecordPageQueryParameters {
  localPage: GraphQLPage<FieldValue> | GraphQLPageMergeable<ProjectItem>
  parentId: string
}

interface RemoteSearchSpaceAccessErrorWithSpaceType {
  error: Error
  type: RemoteSearchSpaceType
}

export default class ColumnNameFinder {
  #cachedSearchResults: Map<string, string>
  #remoteSearchSpaceAccessErrors: RemoteSearchSpaceAccessErrorWithSpaceType[]
  #githubAPIClient: GithubAPIClient
  #hasExpandedSearchSpace: boolean
  #issue: Issue
  #remoteSearchSpaceParameterQueue: RemoteRecordPageQueryParameters[]

  constructor (githubAPIClient: GithubAPIClient, issue: Issue) {
    this.#cachedSearchResults = new Map()
    this.#remoteSearchSpaceAccessErrors = []
    this.#hasExpandedSearchSpace = false
    this.#githubAPIClient = githubAPIClient
    this.#issue = issue
    this.#remoteSearchSpaceParameterQueue = []
  }

  getRemoteSearchSpaceAccessErrors () {
    return this.#remoteSearchSpaceAccessErrors
  }

  async findColumnNames (projectKey?: ProjectPrimaryKeyHumanReadable): Promise<string[]> {
    if (projectKey !== undefined && projectKey.hasNumber()) {
      const cacheCheckResult = this.#findCachedResult(projectKey)

      if (cacheCheckResult.length > 0) {
        return cacheCheckResult
      }
    } else if (this.#isSearchComplete()) {
      return this.#findCachedResult(projectKey)
    }

    do {
      const searchResult = this.#searchLocallyForColumnName(projectKey)

      if (searchResult !== undefined) {
        this.#remoteSearchSpaceParameterQueue = []
        return [ searchResult ]
      }

      await this.#tryAddRemoteSearchSpace()
    } while (this.#hasAdditionalRemoteSearchSpace())

    return this.#findCachedResult(projectKey)
  }

  hasDisabledRemoteSearchSpace () {
    return this.#remoteSearchSpaceAccessErrors.length > 0
  }

  #cacheSearchResult (projectKey: ProjectPrimaryKeyHumanReadable, columnName: string) {
    this.#cachedSearchResults.set(projectKey.asStringKey(), columnName)
  }

  #findCachedResult (projectKey?: ProjectPrimaryKeyHumanReadable): string[] {
    if (projectKey !== undefined) {
      if (!(projectKey.hasNumber())) {
        const columnNames = []
        const projectNameMatchTestRegex = new RegExp(`^${projectKey.getName()} \d+`)

        for (const [projectKeyAsString, columnName] of this.#cachedSearchResults) {
          if(projectNameMatchTestRegex.test(projectKeyAsString)) {
            columnNames.push(columnName)
          }
        }

        return columnNames
      } else {
        const projectKeyCachedResult = this.#cachedSearchResults.get(projectKey.asStringKey())
        return projectKeyCachedResult === undefined ? [] : [ projectKeyCachedResult ]
      }
    } else if (this.#cachedSearchResults.size !== 0) {
      return this.#getAllFoundColumnNames()
    } else {
      return []
    }
  }

  #getAllFoundColumnNames () {
    return Array.from(this.#cachedSearchResults.values())
  }

  #hasAdditionalRemoteSearchSpace (): boolean {
    const projectItemPage = this.#issue.getProjectItemPage()
    const projectItemContainingIncompleteFieldValuePage = projectItemPage.getNodeArray().find((projectItem) => {
      return projectItem.getFieldValuePage().hasNextPage()
    })

    return projectItemPage.hasNextPage() || projectItemContainingIncompleteFieldValuePage !== undefined
  }

  #hasLocalUnsearchedSpace (): boolean {
    return !(this.#issue.getProjectItemPage().isEmpty())
  }

  #isSearchComplete (): boolean {
    return !(this.#hasAdditionalRemoteSearchSpace() || this.#hasLocalUnsearchedSpace())
  }

  #storeIfError (error: any, type: RemoteSearchSpaceType) {
    if (error instanceof Error) {
      this.#remoteSearchSpaceAccessErrors.push({
        error,
        type
      })
    }
  }

  #searchLocallyForColumnName (projectKey?: ProjectPrimaryKeyHumanReadable): string | undefined {
    const projectItemPage = this.#issue.getProjectItemPage()
    const projectItems = projectItemPage.getNodeArray()

    let i = projectItems.length - 1

    while (i >= 0) {
      const projectItem = projectItems[i]
      const columnNameSearchResult = projectItem.findColumnName()

      if (columnNameSearchResult === null) {
        const fieldValuePage = projectItem.getFieldValuePage()

        if (fieldValuePage.hasNextPage() && this.#hasExpandedSearchSpace) {
          this.#remoteSearchSpaceParameterQueue.push({
            parentId: projectItem.getId(),
            localPage: fieldValuePage
          })
        } else if (!(fieldValuePage.hasNextPage())) {
          projectItemPage.delete(i)
        }
      } else {
        projectItemPage.delete(i)

        this.#cacheSearchResult(projectItem.getProjectHumanReadablePrimaryKey(), columnNameSearchResult)

        if (projectKey !== undefined && projectItem.getProjectHumanReadablePrimaryKey().equals(projectKey)) {
          return columnNameSearchResult
        }
      }

      i--
    }
  }

  async #tryAddExpandedSearchSpace() {
    try {
      const issue = this.#issue
      const expandedColumnNameSearchSpacePOJO = (await this.#githubAPIClient.fetchExpandedColumnNameSearchSpace(issue.getId()))
      this.#issue.getProjectItemPage().merge(new GraphQLPageMergeable<ProjectItem>(expandedColumnNameSearchSpacePOJO.node.projectItems, ProjectItem))
      this.#hasExpandedSearchSpace = true
    } catch (error) {
      this.#storeIfError(error, RemoteSearchSpaceType.EXPANDED_SEARCH_SPACE)
      this.#issue.disableColumnNameRemoteSearchSpace()
    }
  }

  async #tryAddPage (page: GraphQLPage<FieldValue> | GraphQLPageMergeable<ProjectItem>, parentId: string) {
    const PageNodeClass = page.lookupNodeClass()

    try {
      switch (PageNodeClass) {
        case FieldValue:
          const fieldValuePagePOJO = (await this.#githubAPIClient.fetchFieldValuePage(parentId, page.getEndCursor())).node.fieldValues;
          (page as GraphQLPage<FieldValue>).appendPage(new GraphQLPage<FieldValue>(fieldValuePagePOJO, FieldValue))
          break
        case ProjectItem:
          const projectItemPagePOJO = (await this.#githubAPIClient.fetchProjectItemPage(parentId, page.getEndCursor())).node.projectItems;
          (page as GraphQLPageMergeable<ProjectItem>).appendPage(new GraphQLPageMergeable<ProjectItem>(projectItemPagePOJO, ProjectItem))
          break
        default:
          throw new Error('Unsupported page node type')
      }
    } catch (error) {
      let remoteSearchSpaceType

      switch (PageNodeClass) {
        case FieldValue:
          remoteSearchSpaceType = RemoteSearchSpaceType.FIELD_VALUE_PAGE
          break
        case ProjectItem:
          remoteSearchSpaceType = RemoteSearchSpaceType.PROJECT_ITEM_PAGE
          break
        default:
          remoteSearchSpaceType = RemoteSearchSpaceType.UNDEFINED
      }

      this.#storeIfError(error, remoteSearchSpaceType)
      page.disableRemoteDataFetching()
    }
  }

  async #tryAddRemoteSearchSpace () {
    const projectItemPage = this.#issue.getProjectItemPage()

    if (this.#hasExpandedSearchSpace) {
      const remoteSearchSpaceParameterQueue = this.#remoteSearchSpaceParameterQueue

      if (projectItemPage.hasNextPage()) {
        remoteSearchSpaceParameterQueue.push({
          parentId: this.#issue.getId(),
          localPage: projectItemPage
        })
      }

      while (remoteSearchSpaceParameterQueue.length > 0) {
        const { localPage, parentId } = remoteSearchSpaceParameterQueue.pop()!

        await this.#tryAddPage(localPage, parentId)
      }
    } else {
      await this.#tryAddExpandedSearchSpace()
    }
  }
}
