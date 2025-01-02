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

  async findColumnNames (projectKey?: ProjectPrimaryKeyHumanReadable): Promise<string[]> {
    const cacheCheckResult = this.#findCachedResult(projectKey)

    if (cacheCheckResult.length > 0) {
      return cacheCheckResult
    }

    do {
      this.#searchLocallyForColumnName(projectKey)

      await this.#tryAddRemoteSearchSpace()
    } while (this.#hasAdditionalRemoteSearchSpace())

    if (projectKey === undefined) {
      return this.#getAllFoundColumnNames()
    } else {
      let columnNameLookup = this.#cachedSearchResults.get(projectKey.asStringKey())

      return columnNameLookup === undefined ? [] : [columnNameLookup]
    }
  }

  hasDisabledRemoteSearchSpace () {
    return this.#hasDisabledSearchSpace
  }

  #cacheSearchResult (projectKey: ProjectPrimaryKeyHumanReadable, columnName: string) {
    this.#cachedSearchResults.set(projectKey.asStringKey(), columnName)
  }

  #findCachedResult (projectKey?: ProjectPrimaryKeyHumanReadable): string[] {
    if (projectKey !== undefined) {
      const projectKeyCachedResult = this.#cachedSearchResults.get(projectKey.asStringKey())
      return projectKeyCachedResult === undefined ? [] : [ projectKeyCachedResult ]
    } else if (!(this.#hasAdditionalRemoteSearchSpace()) && this.#cachedSearchResults.size !== 0) {
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

  #searchLocallyForColumnName (projectKey?: ProjectPrimaryKeyHumanReadable): void {
    const projectItemPage = this.#issue.getProjectItemPage()
    const projectItems = projectItemPage.getNodeArray()

    let i = projectItems.length - 1

    while (i >= 0) {
      const projectItem = projectItems[i]
      const columnNameSearchResults = projectItem.findColumnName()

      if (columnNameSearchResults === null) {
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

        this.#cacheSearchResult(projectItem.getProjectHumanReadablePrimaryKey(), columnNameSearchResults)

        if (projectKey !== undefined && projectItem.getProjectHumanReadablePrimaryKey().equals(projectKey)) {
          return
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
      this.#hasDisabledSearchSpace = true
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
      }
    } catch (error) {
      this.#hasDisabledSearchSpace = true
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