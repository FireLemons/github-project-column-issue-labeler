import { GithubAPIClient } from '../src/githubAPIClient'
import { GithubGraphQLPageAssembler } from '../src/githubGraphQLPageAssembler'
import GithubObjectsTestData from './githubObjectsTestData'

jest.mock('../src/githubAPIClient')

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