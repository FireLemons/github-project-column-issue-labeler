import { FieldValue, GraphQLPage, GraphQLPageMergeable, Issue, ProjectItem, ProjectPrimaryKeyHumanReadable } from './githubObjects'
import { GithubAPIClient } from './githubAPIClient'

interface RemoteRecordPageQueryParameters {
  localPage: GraphQLPage<FieldValue> | GraphQLPageMergeable<ProjectItem>
  parentId: string
}

export default class ColumnNameFinder {
  #cachedSearchResults: Map<string, string>
  #githubAPIClient: GithubAPIClient
  #hasDisabledSearchSpace: boolean
  #hasExpandedSearchSpace: boolean
  #issue: Issue
  #remoteSearchSpaceParameterQueue: RemoteRecordPageQueryParameters[]

  constructor (githubAPIClient: GithubAPIClient, issue: Issue) {
    this.#cachedSearchResults = new Map()
    this.#hasDisabledSearchSpace = false
    this.#hasExpandedSearchSpace = false
    this.#githubAPIClient = githubAPIClient
    this.#issue = issue
    this.#remoteSearchSpaceParameterQueue = []
  }

  async findColumnNames (projectKey?: ProjectPrimaryKeyHumanReadable): Promise<string[] | null> {
    const cacheCheckResult = this.#findCachedResult(projectKey)

    if (cacheCheckResult !== null) {
      return cacheCheckResult
    }
  
    let hasNewSearchSpace = false
    const issue = this.#issue

    do {
      const localColumnNameSearchResult = this.#searchLocallyForColumnName(projectKey)

      if (projectKey !== undefined) {
        this.#remoteSearchSpaceParameterQueue = []
        return localColumnNameSearchResult
      }

      hasNewSearchSpace = await this.#tryAddRemoteSearchSpace()
    } while (hasNewSearchSpace)

    return this.#cachedSearchResults.size === 0 ? null : this.#getAllFoundColumnNames()
  }

  hasDisabledRemoteSearchSpace () {
    return this.#hasDisabledSearchSpace
  }

  #cacheSearchResult (projectKey: ProjectPrimaryKeyHumanReadable, columnName: string) {
    this.#cachedSearchResults.set(projectKey.asStringKey(), columnName)
  }

  #findCachedResult (projectKey?: ProjectPrimaryKeyHumanReadable): string[] | null {
    if (projectKey !== undefined) {
      const projectKeyCachedResult = this.#cachedSearchResults.get(projectKey.asStringKey())
      return projectKeyCachedResult === undefined ? null : [ projectKeyCachedResult ]
    } else if (!(this.#hasAdditionalRemoteSearchSpace()) && this.#cachedSearchResults.size !== 0) {
      return this.#getAllFoundColumnNames()
    } else {
      return null
    }
  }

  #getAllFoundColumnNames () {
    return Array.from(this.#cachedSearchResults.values())
  }

  #hasAdditionalRemoteSearchSpace (): boolean {
    const projectItemPage = this.#issue.getProjectItemPage()

    return !(projectItemPage.isEmpty()) && projectItemPage.hasNextPage()
  }

  #searchLocallyForColumnName (projectKey?: ProjectPrimaryKeyHumanReadable): string[] | null {
    const projectItemPage = this.#issue.getProjectItemPage()
    const projectItems = projectItemPage.getNodeArray()

    let i = projectItems.length - 1

    while (i >= 0) {
      const projectItem = projectItems[i]
      const columnNameSearchResult = projectItem.findColumnName()

      if (columnNameSearchResult === null) {
        if (this.#hasExpandedSearchSpace) {
          const fieldValuePage = projectItem.getFieldValuePage()

          if (fieldValuePage.hasNextPage()) {
            this.#remoteSearchSpaceParameterQueue.push({
              parentId: projectItem.getId(),
              localPage: fieldValuePage
            })
          } else {
            projectItemPage.delete(i)
          }
        }
      } else {
        projectItemPage.delete(i)

        this.#cacheSearchResult(projectItem.getProjectHumanReadablePrimaryKey(), columnNameSearchResult)

        if (projectKey !== undefined && projectItem.getProjectHumanReadablePrimaryKey().equals(projectKey)) {
          return [ columnNameSearchResult ]
        }
      }

      i--
    }

    return null
  }

  async #tryAddExpandedSearchSpace() {
    try {
      const issue = this.#issue
      const expandedColumnNameSearchSpacePOJO = (await this.#githubAPIClient.fetchExpandedColumnNameSearchSpace(issue.getId()))
      this.#issue.getProjectItemPage().merge(new GraphQLPageMergeable<ProjectItem>(expandedColumnNameSearchSpacePOJO.node.projectItems, ProjectItem))
      this.#hasExpandedSearchSpace = true
      return true
    } catch (error) {
      this.#hasDisabledSearchSpace = true
      this.#issue.disableColumnNameRemoteSearchSpace()
      return false
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
      }

      return true
    } catch (error) {
      this.#hasDisabledSearchSpace = true
      page.disableRemoteDataFetching()
      return false
    }
  }

  async #tryAddRemoteSearchSpace () {
    const projectItemPage = this.#issue.getProjectItemPage()

    if (this.#hasExpandedSearchSpace) {
      let hasNewSearchSpace = false
      const remoteSearchSpaceParameterQueue = this.#remoteSearchSpaceParameterQueue

      if (projectItemPage.hasNextPage()) {
        remoteSearchSpaceParameterQueue.push({
          parentId: this.#issue.getId(),
          localPage: projectItemPage
        })
      }

      while (remoteSearchSpaceParameterQueue.length > 0) {
        const { localPage, parentId } = remoteSearchSpaceParameterQueue.pop()!

        hasNewSearchSpace = hasNewSearchSpace || await this.#tryAddPage(localPage, parentId)
      }

      return hasNewSearchSpace
    } else {
      return await this.#tryAddExpandedSearchSpace()
    }
  }
}