import ColumnNameFinder, { RemoteSearchSpaceType } from "../src/columnNameFinder"
import ColumnNameSearchSpaceData from "./data/columnNameSearchSpaceData"
import { Issue, ProjectPrimaryKeyHumanReadable } from "../src/githubObjects"
import { GithubAPIClient } from "../src/githubAPIClient"

jest.mock('../src/githubAPIClient')

let githubAPIClient: GithubAPIClient

beforeEach(() => {
  githubAPIClient = new GithubAPIClient('api key', 'repo name', 'repo owner name')
})

describe('findColumnNames()', () => {
  describe('with a project key parameter', () => {
    it('returns the column name with a matching project key', async () => {
      const issuePOJO = ColumnNameSearchSpaceData.getIssuePOJOWithCompleteSearchSpaceContainingMultipleColumnNames()
      const targetProjectItemPOJO = issuePOJO.projectItems.edges[2]
      const targetProjectPOJO = targetProjectItemPOJO.node.project
      const targetProjectKey = new ProjectPrimaryKeyHumanReadable(targetProjectPOJO.owner.login, targetProjectPOJO.number)
      const targetColumnName = targetProjectItemPOJO.node.fieldValues.edges[0].node.name

      const finder = new ColumnNameFinder(githubAPIClient, new Issue(issuePOJO))
      const searchResult = await finder.findColumnNames(targetProjectKey)

      expect(searchResult.length).toBe(1)
      expect(searchResult[0]).toBe(targetColumnName)
    })

    it('returns the same result when called twice with the same parameters', async () => {
      const issuePOJO = ColumnNameSearchSpaceData.getIssuePOJOWithCompleteSearchSpaceContainingMultipleColumnNames()
      const targetProjectItemPOJO = issuePOJO.projectItems.edges[2]
      const targetProjectPOJO = targetProjectItemPOJO.node.project
      const targetProjectKey = new ProjectPrimaryKeyHumanReadable(targetProjectPOJO.owner.login, targetProjectPOJO.number)
      const nonMatchingProjectKey = new ProjectPrimaryKeyHumanReadable('unmatched owner name', 6)

      const finder = new ColumnNameFinder(githubAPIClient, new Issue(issuePOJO))

      expect(await finder.findColumnNames(targetProjectKey)).toEqual(await finder.findColumnNames(targetProjectKey))
      expect(await finder.findColumnNames(nonMatchingProjectKey)).toEqual(await finder.findColumnNames(nonMatchingProjectKey))
    })

    it('returns empty array if no column name could be found with a matching project key', async () => {
      const issuePOJO = ColumnNameSearchSpaceData.getIssuePOJOWithCompleteSearchSpaceContainingMultipleColumnNames()
      const targetProjectKey = new ProjectPrimaryKeyHumanReadable('unmatched project owner name', 1)

      const finder = new ColumnNameFinder(githubAPIClient, new Issue(issuePOJO))
      const searchResult = await finder.findColumnNames(targetProjectKey)

      expect(searchResult.length).toBe(0)
    })

    it('returns empty array if no column names are in the search space', async () => {
      const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithCompleteEmptySearchSpace()))
      const projectKey = new ProjectPrimaryKeyHumanReadable('project owner name', 1)
      const searchResult = await finder.findColumnNames(projectKey)

      expect(searchResult.length).toBe(0)
    })

    it('caches the search result so it does not fetch the remote search space again', async () => {
      const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))

      const expandedColumnNameSearchSpacePOJO = ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAColumnNameAndIncompletePages()
      const targetProjectPOJO = expandedColumnNameSearchSpacePOJO.node.projectItems.edges[0].node.project
      const targetProjectKey = new ProjectPrimaryKeyHumanReadable(targetProjectPOJO.owner.login, targetProjectPOJO.number)

      const expandedSpaceFetchSpy = jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(expandedColumnNameSearchSpacePOJO)
      const fieldValuePageFetchSpy = jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getFieldValuePageResponseContainingAColumnNameAndNoAdditionalPagesIndicated())
      const projectItemPageFetchSpy = jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getProjectItemPageResponseContainingTwoColumnNamesAndNoAdditionalPagesIndicated())

      expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(0)
      expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(0)
      expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(0)

      await finder.findColumnNames(targetProjectKey)

      expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(1)
      expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(0)
      expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(0)

      await finder.findColumnNames(targetProjectKey)

      expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(1)
      expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(0)
      expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(0)
    })

    it('caches all column names found during the search so it does not fetch the remote search space again', async () => {
      const issuePOJO = ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteSearchSpaceContainingOneColumnName()
      const secondTargetProjectPOJO = issuePOJO.projectItems.edges[0].node.project
      const secondTargetProjectKey = new ProjectPrimaryKeyHumanReadable(secondTargetProjectPOJO.owner.login, secondTargetProjectPOJO.number)
      const finder = new ColumnNameFinder(githubAPIClient, new Issue(issuePOJO))

      const expandedColumnNameSearchSpacePOJO = ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingTwoColumnNamesAndOnlyCompletePages()
      const firstTargetProjectPOJO = expandedColumnNameSearchSpacePOJO.node.projectItems.edges[1].node.project
      const firstTargetProjectKey = new ProjectPrimaryKeyHumanReadable(firstTargetProjectPOJO.owner.login, firstTargetProjectPOJO.number)

      const expandedSpaceFetchSpy = jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(expandedColumnNameSearchSpacePOJO)
      const fieldValuePageFetchSpy = jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockRejectedValue(new Error('unexpected call'))
      const projectItemPageFetchSpy = jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockRejectedValue(new Error('unexpected call'))

      expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(0)
      expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(0)
      expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(0)

      await finder.findColumnNames(firstTargetProjectKey)

      expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(1)
      expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(0)
      expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(0)

      await finder.findColumnNames(secondTargetProjectKey)

      expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(1)
      expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(0)
      expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(0)
    })
  })

  describe('without a project key parameter', () => {
    it('searches the entire search space for all column names', async () => {
      const issuePOJO = ColumnNameSearchSpaceData.getIssuePOJOWithCompleteSearchSpaceContainingManyProjectItems()
      const issue = new Issue(issuePOJO)

      const finder = new ColumnNameFinder(githubAPIClient, issue)
      await finder.findColumnNames()

      expect(issue.getProjectItemPage().getEdges().length).toBe(0)
    })

    it('returns all column names in the search space', async () => {
      const issuePOJO = ColumnNameSearchSpaceData.getIssuePOJOWithCompleteSearchSpaceContainingManyProjectItems()
      const columnName1 = issuePOJO.projectItems.edges[1].node.fieldValues.edges[0].node.name
      const columnName2 = issuePOJO.projectItems.edges[2].node.fieldValues.edges[0].node.name
      const columnName3 = issuePOJO.projectItems.edges[3].node.fieldValues.edges[0].node.name

      const finder = new ColumnNameFinder(githubAPIClient, new Issue(issuePOJO))
      const searchResult = await finder.findColumnNames()

      expect(searchResult).toContain(columnName1)
      expect(searchResult).toContain(columnName2)
      expect(searchResult).toContain(columnName3)
    })

    it('returns the same result when called twice', async () => {
      const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithCompleteSearchSpaceContainingMultipleColumnNames()))

      expect(await finder.findColumnNames()).toEqual(await finder.findColumnNames())
    })

    it('returns empty array if no column names are in the search space', async () => {
      const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithCompleteEmptySearchSpace()))
      const searchResult = await finder.findColumnNames()

      expect(searchResult).toEqual([])
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
