import { FieldValue, GraphQLPage, GraphQLPageMergeable, Issue, ProjectItem, ProjectPrimaryKeyHumanReadable } from './githubObjects'
import { GithubAPIClient } from './githubAPIClient'

export enum RemoteSearchSpaceType {
  EXPANDED_SEARCH_SPACE = 'EXPANDED_SEARCH_SPACE',
  FIELD_VALUE_PAGE = 'FIELD_VALUE_PAGE',
  PROJECT_ITEM_PAGE = 'PROJECT_ITEM_PAGE',
  UNDEFINED = 'UNDEFINED'
}

type ProjectColumnNameMap = Map<string, Map<number, ColumnNameMap>>
type ColumnNameMap = Map<string, null>

interface RemoteRecordPageQueryParameters {
  localPage: GraphQLPage<FieldValue> | GraphQLPageMergeable<ProjectItem>
  parentId: string
}

interface RemoteSearchSpaceAccessErrorWithSpaceType {
  error: Error
  type: RemoteSearchSpaceType
}

export default class ColumnNameFinder {
  #cacheSearchResult: (columnName: string, projectOwnerName?: string, number?: number) => void
  #cachedSearchResults: ColumnNameMap | ProjectColumnNameMap
  #remoteSearchSpaceAccessErrors: RemoteSearchSpaceAccessErrorWithSpaceType[]
  #githubAPIClient: GithubAPIClient
  #hasExpandedSearchSpace: boolean
  #issue: Issue
  #remoteSearchSpaceParameterQueue: RemoteRecordPageQueryParameters[]

  constructor (githubAPIClient: GithubAPIClient, isProjectMode: boolean, issue: Issue) {
    this.#cachedSearchResults = new Map()
    this.#remoteSearchSpaceAccessErrors = []
    this.#hasExpandedSearchSpace = false
    this.#githubAPIClient = githubAPIClient
    this.#issue = issue
    this.#remoteSearchSpaceParameterQueue = []

    if (isProjectMode) {
      this.#cacheSearchResult = this.#cacheSearchResultProjectMode
    } else {
      this.#cacheSearchResult = this.#cacheSearchResultColumnMode
    }
  }

  getRemoteSearchSpaceAccessErrors () {
    return this.#remoteSearchSpaceAccessErrors
  }

  async findColumnNames (): Promise<ColumnNameMap | ProjectColumnNameMap> {
    this.#searchLocallyForColumnName()

    while (this.#hasAdditionalRemoteSearchSpace()) {
      await this.#tryAddRemoteSearchSpace()
      this.#searchLocallyForColumnName()
    }

    return this.#cachedSearchResults
  }

  hasDisabledRemoteSearchSpace () {
    return this.#remoteSearchSpaceAccessErrors.length > 0
  }

  #cacheSearchResultColumnMode (columnName: string) {
    const cachedSearchResults: ColumnNameMap = this.#cachedSearchResults as ColumnNameMap

    cachedSearchResults.set(columnName.toLocaleLowerCase(), null)
  }

  #cacheSearchResultProjectMode (columnName: string, projectOwnerName: string = '', projectNumber: number = 0) {
    const cachedSearchResults = this.#cachedSearchResults as ProjectColumnNameMap
    let projectNumberMap = cachedSearchResults.get(projectOwnerName)

    if (projectNumberMap === undefined) {
      projectNumberMap = new Map()
      cachedSearchResults.set(projectOwnerName, projectNumberMap)
    }

    let columnNameMap = projectNumberMap.get(projectNumber)

    if (columnNameMap === undefined) {
      columnNameMap = new Map()
      projectNumberMap.set(projectNumber, columnNameMap)
    }

    columnNameMap.set(columnName.toLocaleLowerCase(), null)
  }

  #hasAdditionalRemoteSearchSpace (): boolean {
    const projectItemPage = this.#issue.getProjectItemPage()
    const projectItemContainingIncompleteFieldValuePage = projectItemPage.getNodeArray().find((projectItem) => {
      return projectItem.getFieldValuePage().hasNextPage()
    })

    return projectItemPage.hasNextPage() || projectItemContainingIncompleteFieldValuePage !== undefined
  }

  #storeIfError (error: any, type: RemoteSearchSpaceType) {
    if (error instanceof Error) {
      this.#remoteSearchSpaceAccessErrors.push({
        error,
        type
      })
    }
  }

  #searchLocallyForColumnName (): void {
    const projectItemPage = this.#issue.getProjectItemPage()
    const projectItems = projectItemPage.getNodeArray()

    let i = projectItems.length - 1

    while (i >= 0) {
      const projectItem = projectItems[i]
      const columnNameSearchResult = projectItem.findColumnName()

      if (columnNameSearchResult === null) {
        const fieldValuePage = projectItem.getFieldValuePage()

        if (!(fieldValuePage.hasNextPage())) {
          projectItemPage.delete(i)
        } else if (this.#hasExpandedSearchSpace) {
          this.#remoteSearchSpaceParameterQueue.push({
            parentId: projectItem.getId(),
            localPage: fieldValuePage
          })
        }
      } else {
        projectItemPage.delete(i)

        const projectKey = projectItem.getProjectHumanReadablePrimaryKey()

        this.#cacheSearchResult(columnNameSearchResult, projectKey.getName(), projectKey.getNumber())
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
