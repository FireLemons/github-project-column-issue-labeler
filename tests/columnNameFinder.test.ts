import ColumnNameFinder from '../src/columnNameFinder'
import ColumnNameSearchSpaceData from './data/columnNameSearchSpaceData'
import { Issue } from '../src/githubObjects'
import { GithubAPIClient } from '../src/githubAPIClient'
import { GraphQLPageType } from '../src/remoteSearchSpaceAccessError'
import { firstKeyValuePairOfMap } from '../src/util'

jest.mock('../src/githubAPIClient')

let githubAPIClient: GithubAPIClient

beforeEach(() => {
  githubAPIClient = new GithubAPIClient('api key', 'repo name', 'repo owner name')
})

describe('findColumnNames()', () => {
  it('searches the entire local search space for all column names', async () => {
    const issuePOJO = ColumnNameSearchSpaceData.getIssuePOJOWithCompleteSearchSpaceContainingManyProjectItems()
    const issue = new Issue(issuePOJO)

    const finder = new ColumnNameFinder(githubAPIClient, false, issue)
    await finder.findColumnNames()

    expect(issue.getProjectItemPage().getEdges().length).toBe(0)
  })

  it('searches the entire remote search space for all column names', async () => {
    const expandedColumnNameSearchSpacePOJO = ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAColumnNameAndIncompletePages()
    jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(expandedColumnNameSearchSpacePOJO)
    jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getFieldValuePageResponseContainingAColumnNameAndNoAdditionalPagesIndicated())
    jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getProjectItemPageResponseContainingTwoColumnNamesAndNoAdditionalPagesIndicated())

    const issue = new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace())
    const finder = new ColumnNameFinder(githubAPIClient, false, issue)

    await finder.findColumnNames()

    expect(issue.getProjectItemPage().getEdges().length).toBe(0)
  })

  it('searches the entire available remote search space for all column names', async () => {
    const expandedColumnNameSearchSpacePOJO = ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAColumnNameAndIncompletePages()
    jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(expandedColumnNameSearchSpacePOJO)
    jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockRejectedValueOnce(new Error('fetch failure'))
    jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getProjectItemPageResponseContainingTwoColumnNamesAndNoAdditionalPagesIndicated())

    const issue = new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace())
    const finder = new ColumnNameFinder(githubAPIClient, false, issue)

    await finder.findColumnNames()

    expect(issue.getProjectItemPage().getEdges().length).toBe(0)
  })

  it('caches the search result so it does not fetch the remote search space again', async () => {
    const expandedColumnNameSearchSpacePOJO = ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAColumnNameAndIncompletePages()
    const expandedSpaceFetchSpy = jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(expandedColumnNameSearchSpacePOJO)
    const fieldValuePageFetchSpy = jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getFieldValuePageResponseContainingAColumnNameAndNoAdditionalPagesIndicated())
    const projectItemPageFetchSpy = jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getProjectItemPageResponseContainingTwoColumnNamesAndNoAdditionalPagesIndicated())

    const finder = new ColumnNameFinder(githubAPIClient, false, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))

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
    it('returns a nested map with outer keys starting at the project owner name then the project number and finally a map containing the column names of the project\'s child column(s)', async () => {
      const finder = new ColumnNameFinder(githubAPIClient, true, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithCompleteSearchSpaceContainingMultipleColumnNames()))
      const columnNames = await finder.findColumnNames()

      expect(typeof firstKeyValuePairOfMap(columnNames)?.key).toBe('string')
      expect(typeof firstKeyValuePairOfMap(firstKeyValuePairOfMap(columnNames)?.value)?.key).toBe('number')
      expect(typeof firstKeyValuePairOfMap(firstKeyValuePairOfMap(firstKeyValuePairOfMap(columnNames)?.value)?.value)?.key).toBe('string')
    })

    it('places each column name under the correct project owner name and project number', async () => {
      const columnNameSearchSpacePOJO = ColumnNameSearchSpaceData.getIssuePOJOWithCompleteSearchSpaceContainingMultipleColumnNames()
      const columnNameA = columnNameSearchSpacePOJO.projectItems.edges[0].node.fieldValues.edges[0].node.name
      const columnNameAProjectParent = columnNameSearchSpacePOJO.projectItems.edges[0].node.project
      const columnNameB = columnNameSearchSpacePOJO.projectItems.edges[1].node.fieldValues.edges[0].node.name
      const columnNameBProjectParent = columnNameSearchSpacePOJO.projectItems.edges[1].node.project
      const columnNameC = columnNameSearchSpacePOJO.projectItems.edges[2].node.fieldValues.edges[0].node.name
      const columnNameCProjectParent = columnNameSearchSpacePOJO.projectItems.edges[2].node.project

      const finder = new ColumnNameFinder(githubAPIClient, true, new Issue(columnNameSearchSpacePOJO))
      const foundColumnNames = await finder.findColumnNames()

      expect(foundColumnNames.get(columnNameAProjectParent.owner.login)?.get(columnNameAProjectParent.number)?.has(columnNameA!.toLocaleLowerCase())).toBe(true)
      expect(foundColumnNames.get(columnNameBProjectParent.owner.login)?.get(columnNameBProjectParent.number)?.has(columnNameB!.toLocaleLowerCase())).toBe(true)
      expect(foundColumnNames.get(columnNameCProjectParent.owner.login)?.get(columnNameCProjectParent.number)?.has(columnNameC!.toLocaleLowerCase())).toBe(true)
    })
  })

  describe('when ColumnNameFinder is not in project mode', () => {
    it('returns a map where the keys are the column names', async () => {
      const columnNameSearchSpacePOJO = ColumnNameSearchSpaceData.getIssuePOJOWithCompleteSearchSpaceContainingMultipleColumnNames()
      const columnNameA = columnNameSearchSpacePOJO.projectItems.edges[0].node.fieldValues.edges[0].node.name
      const columnNameB = columnNameSearchSpacePOJO.projectItems.edges[1].node.fieldValues.edges[0].node.name
      const columnNameC = columnNameSearchSpacePOJO.projectItems.edges[2].node.fieldValues.edges[0].node.name

      const finder = new ColumnNameFinder(githubAPIClient, false, new Issue(columnNameSearchSpacePOJO))
      const foundColumnNames = await finder.findColumnNames()
      expect(foundColumnNames.has(columnNameA!.toLocaleLowerCase())).toBe(true)
      expect(foundColumnNames.has(columnNameB!.toLocaleLowerCase())).toBe(true)
      expect(foundColumnNames.has(columnNameC!.toLocaleLowerCase())).toBe(true)
    })

    it('duplicate column names with different cases are reduced to a single column name', () => {
      const columnNameSearchSpacePOJO = ColumnNameSearchSpaceData.getIssuePOJOWithCompleteSearchSpaceContainingDuplicateColumnNamesWithDifferentCase()
      const columnNameA = columnNameSearchSpacePOJO.projectItems.edges[0].node.fieldValues.edges[0].node.name
      const columnNameB = columnNameSearchSpacePOJO.projectItems.edges[1].node.fieldValues.edges[0].node.name

      expect(columnNameA).not.toBe(columnNameB)
      expect(columnNameA?.toLocaleLowerCase()).toBe(columnNameB?.toLocaleLowerCase())
    })
  })
})

describe('getRemoteSearchSpaceAccessErrors()', () => {
  it('returns a list of errors caused by attempting to access remote search space thrown during the search', async () => {
    const finder = new ColumnNameFinder(githubAPIClient, false, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))
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
      return remoteSearchSpaceAccessErrorWithSpaceType.message === error1.message
    })).not.toBe(undefined)

    expect(errors.find((remoteSearchSpaceAccessErrorWithSpaceType) => {
      return remoteSearchSpaceAccessErrorWithSpaceType.message === error2.message
    })).not.toBe(undefined)
  })

  it('returns an empty list if all column name search space requested was successfully added to the local search space', async () => {
    const finder = new ColumnNameFinder(githubAPIClient, false, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))

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
    expect(finder.getRemoteSearchSpaceAccessErrors()).toEqual([])
  })

  it('pairs the correct search space type with an error thrown by attempting to add the extended column name search space', async () => {
    const finder = new ColumnNameFinder(githubAPIClient, false, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))
    const expandedSearchSpaceFetchError = new Error('J$=\\@AadR28ckxLg$+')
    const expandedSpaceFetchSpy = jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockRejectedValue(expandedSearchSpaceFetchError)

    await finder.findColumnNames()

    expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(1)

    const errors = finder.getRemoteSearchSpaceAccessErrors()
    const remoteSearchSpaceAccessErrorWithSpaceType = errors.find((remoteSearchSpaceAccessErrorWithSearchSpaceType) => {
      return remoteSearchSpaceAccessErrorWithSearchSpaceType.message === expandedSearchSpaceFetchError.message
    })

    expect(remoteSearchSpaceAccessErrorWithSpaceType?.getPageType()).toBe(GraphQLPageType.EXPANDED_SEARCH_SPACE)
  })

  it('pairs the correct search space type with an error thrown by attempting to add a FieldValue page', async () => {
    const finder = new ColumnNameFinder(githubAPIClient, false, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))
    const fieldValueFetchError = new Error('J$=\\@AadR28ckxLg$+')
    jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAnIncompleteProjectItemPageAndAnIncompleteFieldValuePage())
    const fieldValuePageFetchSpy = jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockRejectedValueOnce(fieldValueFetchError)
    jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockRejectedValueOnce(ColumnNameSearchSpaceData.getProjectItemPageResponseContainingTwoColumnNamesAndNoAdditionalPagesIndicated())

    await finder.findColumnNames()

    expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(1)

    const errors = finder.getRemoteSearchSpaceAccessErrors()
    const remoteSearchSpaceAccessErrorWithSpaceType = errors.find((remoteSearchSpaceAccessErrorWithSearchSpaceType) => {
      return remoteSearchSpaceAccessErrorWithSearchSpaceType.message === fieldValueFetchError.message
    })

    expect(remoteSearchSpaceAccessErrorWithSpaceType?.getPageType()).toBe(GraphQLPageType.FIELD_VALUE_PAGE)
  })

  it('pairs the correct search space type with an error thrown by attempting to add a ProjectItem page', async () => {
    const finder = new ColumnNameFinder(githubAPIClient, false, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))
    const projectItemFetchError = new Error('J$=\\@AadR28ckxLg$+')
    jest.spyOn(githubAPIClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAnIncompleteProjectItemPageAndAnIncompleteFieldValuePage())
    jest.spyOn(githubAPIClient, 'fetchFieldValuePage').mockResolvedValueOnce(ColumnNameSearchSpaceData.getFieldValuePageResponseContainingAColumnNameAndNoAdditionalPagesIndicated())
    const projectItemPageFetchSpy = jest.spyOn(githubAPIClient, 'fetchProjectItemPage').mockRejectedValueOnce(projectItemFetchError)

    await finder.findColumnNames()

    expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(1)

    const errors = finder.getRemoteSearchSpaceAccessErrors()
    const remoteSearchSpaceAccessErrorWithSpaceType = errors.find((remoteSearchSpaceAccessErrorWithSearchSpaceType) => {
      return remoteSearchSpaceAccessErrorWithSearchSpaceType.message === projectItemFetchError.message
    })

    expect(remoteSearchSpaceAccessErrorWithSpaceType?.getPageType()).toBe(GraphQLPageType.PROJECT_ITEM_PAGE)
  })
})
