import ColumnNameFinder from "../src/columnNameFinder"
import ColumnNameSearchSpaceData from "./data/columnNameSearchSpaceData"
import { Issue, ProjectPrimaryKeyHumanReadable } from "../src/githubObjects"
import { GithubAPIClient } from "../src/githubAPIClient"

jest.mock('../src/githubAPIClient')

describe('findColumnNames()', () => {
  let githubAPIClient: GithubAPIClient

  beforeEach(() => {
    githubAPIClient = new GithubAPIClient('api key', 'repo name', 'repo owner name')
  })

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

      const expandedColumnNameSearchSpacePOJO = ColumnNameSearchSpaceData.getExtendedColumnNameResponseContainingAnIncompleteProjectItemPageAndAnIncompleteFieldValuePage()
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
      expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(1)
      expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(1)

      await finder.findColumnNames(targetProjectKey)

      expect(expandedSpaceFetchSpy).toHaveBeenCalledTimes(1)
      expect(fieldValuePageFetchSpy).toHaveBeenCalledTimes(1)
      expect(projectItemPageFetchSpy).toHaveBeenCalledTimes(1)
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
    it('searches the entire search space for all column names', () => {
      throw new Error('unimplimented')
    })

    it('returns all column names in the search space', () => {
      throw new Error('unimplimented')
    })

    it('returns empty array if no column names are in the search space', () => {
      const finder = new ColumnNameFinder(githubAPIClient, new Issue(ColumnNameSearchSpaceData.getIssuePOJOWithIncompleteEmptySearchSpace()))
      throw new Error('unimplimented')
    })

    it('caches the search result so it does not fetch the remote search space again', () => {
      throw new Error('unimplimented')
    })
  })
})

describe('getErrors()', () => {
  it('returns a list of errors thrown during the search', () => {
    throw new Error('unimplimented')
  })

  it('pairs the correct message with an error thrown by attempting to add a ProjectItem page', () => {
    throw new Error('unimplimented')
  })

  it('pairs the correct message with an error thrown by attempting to add a FieldValue page', () => {
    throw new Error('unimplimented')
  })

  it('pairs the correct message with an error thrown by attempting to add the extended column name search space', () => {
    throw new Error('unimplimented')
  })
})

describe('hasDisabledRemoteSearchSpace()', () => {
  it('returns true if all column name search space requested was successfully added to the local search space', () => {
    throw new Error('unimplimented')
  })

  it('returns false if all the column name search space could not be added to the local search space', () => {
    throw new Error('unimplimented')
  })
})