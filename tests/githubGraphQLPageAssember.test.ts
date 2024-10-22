import { GithubAPIClient } from '../src/githubAPIClient'
import { GithubGraphQLPageAssembler } from '../src/githubGraphQLPageAssembler'
import GithubObjectsTestData from './githubObjectsTestData'

jest.mock('../src/githubAPIClient')

describe('fetchAdditionalSearchSpace()', () => {
  describe('when the query parameters are passed as a field value GraphQLPage', () => {
    it('does not intercept errors thrown by the github API client', () => {

    })

    it('appends the values from the retrieved page to the local field value page', () => {

    })

    it('updates the end cursor of the local field value page to the value of the retrieved page', () => {
      
    })

    it('updates the hasNextPage value of the local field value page to the value of the retrieved page', () => {
      
    })
  })
  describe('when the query parameters are passed as a label GraphQLPage', () => {
    it('does not intercept errors thrown by the github API client', () => {

    })

    it('appends the values from the retrieved page to the local label page', () => {

    })

    it('updates the end cursor of the local label page to the value of the retrieved page', () => {
      
    })

    it('updates the hasNextPage value of the local label page to the value of the retrieved page', () => {
      
    })
  })
  describe('when the query parameters are passed as a project item GraphQLPage', () => {
    it('does not intercept errors thrown by the github API client', () => {

    })

    it('appends the values from the retrieved page to the local project item page', () => {

    })

    it('updates the end cursor of the local project item page to the value of the retrieved page', () => {
      
    })

    it('updates the hasNextPage value of the local project item page to the value of the retrieved page', () => {
      
    })
  })
  describe('when the query parameters are passed as an Issue', () => {
    it('does not intercept errors thrown by the github API client', () => {

    })

    it('does not restore locally deleted project items', () => {

    })

    it('adds new values from the retrieved pages to the local project item page', () => {

    })

    it('adds new values from the retrieved pages to the local field value pages', () => {

    })

    it('updates the end cursor of the local project item page to the value of the retrieved page', () => {
      
    })

    it('updates the hasNextPage value of the local project item page to the value of the retrieved page', () => {
      
    })

    it('updates the end cursors of the local field value pages to the values of the retrieved pages', () => {
      
    })

    it('updates the hasNextPage values of the local field value pages to the values of the retrieved pages', () => {
      
    })
  })
})

describe('fetchAllIssues()', () => {
  describe('when none of the issues could be fetched', () => {
    it('throws an error when none of the issues could be fetched', async () => {
      const githubClient = new GithubAPIClient('api key', 'repo name', 'repo owner name')
      const error = new Error('mock failure')

      jest.spyOn(githubClient, 'fetchIssuePage').mockRejectedValue(error)

      const pageAssembler = new GithubGraphQLPageAssembler(githubClient)

      await expect(pageAssembler.fetchAllIssues()).rejects.toMatchObject(error)
    })
  })

  describe('when some of the issues could be fetched', () => {
    it('marks the returned issue page as not having any more remote pages available for fetching', async () => {
      const githubClient = new GithubAPIClient('api key', 'repo name', 'repo owner name')
      const error = new Error('mock failure')

      const issuePagePOJO = {
        repository: {
          issues: GithubObjectsTestData.getIssuePagePOJO()
        }
      }

      jest.spyOn(githubClient, 'fetchIssuePage').mockResolvedValueOnce(issuePagePOJO).mockRejectedValueOnce(error)

      const pageAssembler = new GithubGraphQLPageAssembler(githubClient)
      const issueFetchResult = await pageAssembler.fetchAllIssues()

      expect(issueFetchResult.isLastPage()).toBe(true)
    })

    it('prints a warning stating that all of the issues were not successfully fetched and that the labeler will be continuing with the issues that were fetched successfully', async () => {
      const warnSpy = jest.spyOn(console, 'warn')

      const githubClient = new GithubAPIClient('api key', 'repo name', 'repo owner name')
      const error = new Error('mock failure')

      const issuePagePOJO = {
        repository: {
          issues: GithubObjectsTestData.getIssuePagePOJO()
        }
      }

      jest.spyOn(githubClient, 'fetchIssuePage').mockResolvedValueOnce(issuePagePOJO).mockRejectedValueOnce(error)

      const pageAssembler = new GithubGraphQLPageAssembler(githubClient)

      await pageAssembler.fetchAllIssues()

      const consoleWarnCalls = warnSpy.mock.calls

      expect(consoleWarnCalls.find((consoleErrorCall) => {
        return /Failed to fetch all issues\. Continuing with subset of successfully fetched issues/.test(consoleErrorCall[0])
      })).not.toBe(undefined)
    })

    it('returns the issues successfully fetched when some of the issues could not be fetched', async () => {
      const githubClient = new GithubAPIClient('api key', 'repo name', 'repo owner name')
      const error = new Error('mock failure')

      const issuePagePOJO = {
        repository: {
          issues: GithubObjectsTestData.getIssuePagePOJO()
        }
      }

      jest.spyOn(githubClient, 'fetchIssuePage').mockResolvedValueOnce(issuePagePOJO).mockRejectedValueOnce(error)

      const pageAssembler = new GithubGraphQLPageAssembler(githubClient)
      const issueFetchResult = await pageAssembler.fetchAllIssues()

      expect(issueFetchResult.getNodeArray().find((node) => {
        return node.getNumber() === 1009
      })).not.toBe(undefined)
    })
  })
})