import ColumnNameFinder, { RemoteSearchSpaceType } from '../src/columnNameFinder'
import ColumnNameSearchSpaceData from './data/columnNameSearchSpaceData'
import { Issue, ProjectPrimaryKeyHumanReadable } from '../src/githubObjects'
import { GithubAPIClient } from '../src/githubAPIClient'

jest.mock('../src/githubAPIClient')

let githubAPIClient: GithubAPIClient

beforeEach(() => {
  githubAPIClient = new GithubAPIClient('api key', 'repo name', 'repo owner name')
})

describe('findColumnNames()', () => {
  it('searches the entire search space for all column names', async () => {
    const issuePOJO = ColumnNameSearchSpaceData.getIssuePOJOWithCompleteSearchSpaceContainingManyProjectItems()
    const issue = new Issue(issuePOJO)

    const finder = new ColumnNameFinder(githubAPIClient, issue)
    await finder.findColumnNames()

    expect(issue.getProjectItemPage().getEdges().length).toBe(0)
  })

  it('caches the search result so it does not fetch the remote search space again', async () => {
    const expandedColumnNameSearchSpacePOJO = ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAColumnNameAndIncompletePages()
    const targetProjectPOJO = expandedColumnNameSearchSpacePOJO.node.projectItems.edges[0].node.project
    const targetProjectKey = new ProjectPrimaryKeyHumanReadable(targetProjectPOJO.owner.login, targetProjectPOJO.number)

    const expandedSpaceFetchSpy = jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(expandedColumnNameSearchSpacePOJO)
    const fieldValuePageFetchSpy = jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getFieldValuePageResponseContainingAColumnNameAndNoAdditionalPagesIndicated())
    const projectItemPageFetchSpy = jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getProjectItemPageResponseContainingTwoColumnNamesAndNoAdditionalPagesIndicated())

    const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))

    expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(0)
    expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(0)
    expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(0)

    await finder.findColumnNames(targetProjectKey)

    expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(1)
    expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(1)
    expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(1)

    await finder.findColumnNames(targetProjectKey)

    expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(1)
    expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(1)
    expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(1)
  })

  it('caches the search result so it does not fetch the remote search space again', async () => {
    const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))

    const expandedSpaceFetchSpy = jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAnIncompleteProjectItemPageAndAnIncompleteFieldValuePage())
    const fieldValuePageFetchSpy = jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getFieldValuePageResponseContainingAColumnNameAndNoAdditionalPagesIndicated())
    const projectItemPageFetchSpy = jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getProjectItemPageResponseContainingTwoColumnNamesAndNoAdditionalPagesIndicated())

    expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(0)
    expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(0)
    expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(0)

    await finder.findColumnNames()

    expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(1)
    expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(1)
    expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(1)

    await finder.findColumnNames()

    expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(1)
    expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(1)
    expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(1)
  })

  describe('when ColumnNameFinder is in project mode', () => {
    it('returns a nested map with outer keys starting at the project owner name then the project number and finally a map containing the column names of the project\'s child column(s)', () => {
      throw new Error('undefined')
    })
  })

  describe('when ColumnNameFinder is not in project mode', () => {
    it('returns a map where the keys are the column names', () => {
      throw new Error('undefined')
    })
  })
})

describe('getRemoteSearchSpaceAccessErrors()', () => {
  it('returns a list of errors caused by attempting to access remote search space thrown during the search', async () => {
    const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))
    const expandedColumnNameSearchSpacePOJO = ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAnIncompleteProjectItemPageAndAnIncompleteFieldValuePage()
    const expandedSpaceFetchSpy = jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(expandedColumnNameSearchSpacePOJO)
    const error1 = new Error('J$=\\@AadR28ckxLg$+')
    const error2 = new Error('/G\\$S\\gXB!VwT{#ps0')
    const fieldValuePageFetchSpy = jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockRejectedValueOnce(error1)
    const projectItemPageFetchSpy = jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockRejectedValueOnce(error2)

    await finder.findColumnNames()

    expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(1)
    expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(1)
    expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(1)

    const errors = finder.getRemoteSearchSpaceAccessErrors()

    expect(errors.find((remoteSearchSpaceAccessErrorWithSpaceType) => {
      return remoteSearchSpaceAccessErrorWithSpaceType.error === error1
    })).not.toBe(undefined)

    expect(errors.find((remoteSearchSpaceAccessErrorWithSpaceType) => {
      return remoteSearchSpaceAccessErrorWithSpaceType.error === error2
    })).not.toBe(undefined)
  })

  it('pairs the correct search space type with an error thrown by attempting to add the extended column name search space', async () => {
    const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))
    const expandedSearchSpaceFetchError = new Error('J$=\\@AadR28ckxLg$+')
    const expandedSpaceFetchSpy = jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockRejectedValue(expandedSearchSpaceFetchError)

    await finder.findColumnNames()

    expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(1)

    const errors = finder.getRemoteSearchSpaceAccessErrors()
    const remoteSearchSpaceAccessErrorWithSpaceType = errors.find((remoteSearchSpaceAccessErrorWithSearchSpaceType) => {
      return remoteSearchSpaceAccessErrorWithSearchSpaceType.error === expandedSearchSpaceFetchError
    })

    expect(remoteSearchSpaceAccessErrorWithSpaceType?.type).toBe(RemoteSearchSpaceType.EXPANDED_SEARCH_SPACE)
  })

  it('pairs the correct search space type with an error thrown by attempting to add a FieldValue page', async () => {
    const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))
    const fieldValueFetchError = new Error('J$=\\@AadR28ckxLg$+')
    jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAnIncompleteProjectItemPageAndAnIncompleteFieldValuePage())
    const fieldValuePageFetchSpy = jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockRejectedValueOnce(fieldValueFetchError)
    jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockRejectedValueOnce(ColumnNameSearchSpaceData.getProjectItemPageResponseContainingTwoColumnNamesAndNoAdditionalPagesIndicated())

    await finder.findColumnNames()

    expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(1)

    const errors = finder.getRemoteSearchSpaceAccessErrors()
    const remoteSearchSpaceAccessErrorWithSpaceType = errors.find((remoteSearchSpaceAccessErrorWithSearchSpaceType) => {
      return remoteSearchSpaceAccessErrorWithSearchSpaceType.error === fieldValueFetchError
    })

    expect(remoteSearchSpaceAccessErrorWithSpaceType?.type).toBe(RemoteSearchSpaceType.FIELD_VALUE_PAGE)
  })

  it('pairs the correct search space type with an error thrown by attempting to add a ProjectItem page', async () => {
    const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))
    const projectItemFetchError = new Error('J$=\\@AadR28ckxLg$+')
    jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAnIncompleteProjectItemPageAndAnIncompleteFieldValuePage())
    jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getFieldValuePageResponseContainingAColumnNameAndNoAdditionalPagesIndicated())
    const projectItemPageFetchSpy = jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockRejectedValueOnce(projectItemFetchError)

    await finder.findColumnNames()

    expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(1)

    const errors = finder.getRemoteSearchSpaceAccessErrors()
    const remoteSearchSpaceAccessErrorWithSpaceType = errors.find((remoteSearchSpaceAccessErrorWithSearchSpaceType) => {
      return remoteSearchSpaceAccessErrorWithSearchSpaceType.error === projectItemFetchError
    })

    expect(remoteSearchSpaceAccessErrorWithSpaceType?.type).toBe(RemoteSearchSpaceType.PROJECT_ITEM_PAGE)
  })
})

describe('hasDisabledRemoteSearchSpace()', () => {
  it('returns false if all column name search space requested was successfully added to the local search space', async () => {
    const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))

    const expandedSpaceFetchSpy = jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAnIncompleteProjectItemPageAndAnIncompleteFieldValuePage())
    const fieldValuePageFetchSpy = jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getFieldValuePageResponseContainingAColumnNameAndNoAdditionalPagesIndicated())
    const projectItemPageFetchSpy = jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getProjectItemPageResponseContainingTwoColumnNamesAndNoAdditionalPagesIndicated())

    expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(0)
    expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(0)
    expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(0)

    await finder.findColumnNames()

    expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(1)
    expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(1)
    expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(1)
    expect(finder.hasDisabledRemoteSearchSpace()).toBe(false)
  })

  it('returns false if a an attempt to add extended search space failed', async () => {
    const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))
    const expandedSearchSpaceFetchError = new Error('J$=\\@AadR28ckxLg$+')
    jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockRejectedValue(expandedSearchSpaceFetchError)

    await finder.findColumnNames()
    expect(finder.hasDisabledRemoteSearchSpace()).toBe(true)
  })

  it('returns false if a an attempt to add a FieldValue page failed', async () => {
    const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))
    const fieldValueFetchError = new Error('J$=\\@AadR28ckxLg$+')
    jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAnIncompleteProjectItemPageAndAnIncompleteFieldValuePage())
    jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockRejectedValueOnce(fieldValueFetchError)
    jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockRejectedValueOnce(ColumnNameSearchSpaceData.getProjectItemPageResponseContainingTwoColumnNamesAndNoAdditionalPagesIndicated())

    await finder.findColumnNames()
    expect(finder.hasDisabledRemoteSearchSpace()).toBe(true)
  })

  it('returns false if a an attempt to add a ProjectItem page failed', async () => {
    const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))
    const projectItemFetchError = new Error('J$=\\@AadR28ckxLg$+')
    jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAnIncompleteProjectItemPageAndAnIncompleteFieldValuePage())
    jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getFieldValuePageResponseContainingAColumnNameAndNoAdditionalPagesIndicated())
    jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockRejectedValueOnce(projectItemFetchError)

    await finder.findColumnNames()
    expect(finder.hasDisabledRemoteSearchSpace()).toBe(true)
  })
})
