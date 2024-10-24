import { ExtendedColumnNameSearchSpaceResponse, FieldValuePageNodePOJO, FieldValuePageResponse, GithubAPIClient, GraphQLPagePOJO, LabelPageResponse, LabelPOJO, ProjectItemPageResponse, ProjectItemPOJO } from '../src/githubAPIClient'
import { GithubGraphQLPageAssembler } from '../src/githubGraphQLPageAssembler'
import { FieldValue, GraphQLPage, GraphQLPageMergeable, Issue, Label, ProjectItem } from '../src/githubObjects'
import GithubObjectsTestData from './githubObjectsTestData'

jest.mock('../src/githubAPIClient')

describe('fetchAdditionalSearchSpace()', () => {
  let githubClient: GithubAPIClient
  let pageAssembler: GithubGraphQLPageAssembler

  beforeEach(() => {
    githubClient = new GithubAPIClient('api key', 'repo name', 'repo owner name')
    pageAssembler = new GithubGraphQLPageAssembler(githubClient)
  })

  describe('when the query parameters are passed as a field value GraphQLPage', () => {
    let localPage: GraphQLPage<FieldValue>
    let fetchedPagePOJO: GraphQLPagePOJO<FieldValuePageNodePOJO>

    beforeEach(() => {
      localPage = new GraphQLPage<FieldValue>(GithubObjectsTestData.getFieldValuePagePOJO(), FieldValue)
      fetchedPagePOJO = GithubObjectsTestData.getLastFieldValuePagePOJO()
    })

    it('does not intercept errors thrown by the github API client', async () => {
      const error = new Error('mock failure')

      jest.spyOn(githubClient, 'fetchFieldValuePage').mockRejectedValue(error)

      await expect(pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })).rejects.toMatchObject(error)
    })

    it('appends the values from the retrieved page to the local field value page', async () => {
      const appendedFieldValueName = fetchedPagePOJO.edges[0].node.name
      const fetchedPageResponse: FieldValuePageResponse = {
        node: {
          fieldValues: fetchedPagePOJO
        }
      }

      expect(localPage.getNodeArray().length).toBe(1)

      jest.spyOn(githubClient, 'fetchFieldValuePage').mockResolvedValueOnce(fetchedPageResponse)

      await pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })

      const updatedPageNodes = localPage.getNodeArray()

      expect(updatedPageNodes.length).toBe(2)
      expect(updatedPageNodes.find((fieldValue) => {
        return fieldValue.name === appendedFieldValueName
      })).not.toBe(undefined)
    })

    it('converts the nodes of the fetched page to FieldValue objects', async () => {
      const fetchedPageResponse: FieldValuePageResponse = {
        node: {
          fieldValues: fetchedPagePOJO
        }
      }

      jest.spyOn(githubClient, 'fetchFieldValuePage').mockResolvedValueOnce(fetchedPageResponse)

      await pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })

      for (const node of localPage.getNodeArray()) {
        expect(node instanceof FieldValue).toBe(true)
      }
    })

    it('updates the end cursor of the local field value page to the value of the retrieved page', async () => {
      const updatedFieldValuePageEndCursor = fetchedPagePOJO.pageInfo.endCursor
      const fetchedPageResponse: FieldValuePageResponse = {
        node: {
          fieldValues: fetchedPagePOJO
        }
      }

      expect(localPage.getEndCursor()).not.toBe(updatedFieldValuePageEndCursor)

      jest.spyOn(githubClient, 'fetchFieldValuePage').mockResolvedValueOnce(fetchedPageResponse)

      await pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })

      expect(localPage.getEndCursor()).toBe(updatedFieldValuePageEndCursor)
    })

    it('updates the hasNextPage value of the local field value page to the value of the retrieved page', async () => {
      const updatedFieldValuePageHasNextPage = fetchedPagePOJO.pageInfo.hasNextPage
      const fetchedPageResponse: FieldValuePageResponse = {
        node: {
          fieldValues: fetchedPagePOJO
        }
      }

      expect(localPage.isLastPage()).not.toBe(!updatedFieldValuePageHasNextPage)

      jest.spyOn(githubClient, 'fetchFieldValuePage').mockResolvedValueOnce(fetchedPageResponse)

      await pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })

      expect(localPage.isLastPage()).toBe(!updatedFieldValuePageHasNextPage)
    })
  })

  describe('when the query parameters are passed as a label GraphQLPage', () => {
    let localPage: GraphQLPage<Label>
    let fetchedPagePOJO: GraphQLPagePOJO<LabelPOJO>

    beforeEach(() => {
      localPage = new GraphQLPage<Label>(GithubObjectsTestData.getLabelPagePOJO(), Label)
      fetchedPagePOJO = GithubObjectsTestData.getLastLabelPagePOJO()
    })

    it('does not intercept errors thrown by the github API client', async () => {
      const error = new Error('mock failure')

      jest.spyOn(githubClient, 'fetchLabelPage').mockRejectedValue(error)

      await expect(pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })).rejects.toMatchObject(error)
    })

    it('appends the values from the retrieved page to the local label page', async () => {
      const appendedLabelName = fetchedPagePOJO.edges[0].node.name
      const fetchedPageResponse: LabelPageResponse = {
        node: {
          labels: fetchedPagePOJO
        }
      }

      expect(localPage.getNodeArray().length).toBe(1)

      jest.spyOn(githubClient, 'fetchLabelPage').mockResolvedValueOnce(fetchedPageResponse)

      await pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })

      const updatedPageNodes = localPage.getNodeArray()

      expect(updatedPageNodes.length).toBe(2)
      expect(updatedPageNodes.find((label) => {
        return label.name === appendedLabelName
      })).not.toBe(undefined)
    })

    it('converts the nodes of the fetched page to Label objects', async () => {
      const fetchedPageResponse: LabelPageResponse = {
        node: {
          labels: fetchedPagePOJO
        }
      }

      jest.spyOn(githubClient, 'fetchLabelPage').mockResolvedValueOnce(fetchedPageResponse)

      await pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })

      for (const node of localPage.getNodeArray()) {
        expect(node instanceof Label).toBe(true)
      }
    })

    it('updates the end cursor of the local label page to the value of the retrieved page', async () => {
      const updatedLabelPageEndCursor = fetchedPagePOJO.pageInfo.endCursor
      const fetchedPageResponse: LabelPageResponse = {
        node: {
          labels: fetchedPagePOJO
        }
      }

      expect(localPage.getEndCursor()).not.toBe(updatedLabelPageEndCursor)

      jest.spyOn(githubClient, 'fetchLabelPage').mockResolvedValueOnce(fetchedPageResponse)

      await pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })

      expect(localPage.getEndCursor()).toBe(updatedLabelPageEndCursor)
    })

    it('updates the hasNextPage value of the local label page to the value of the retrieved page', async () => {
      const updatedLabelPageHasNextPage = fetchedPagePOJO.pageInfo.hasNextPage
      const fetchedPageResponse: LabelPageResponse = {
        node: {
          labels: fetchedPagePOJO
        }
      }

      expect(localPage.isLastPage()).not.toBe(!updatedLabelPageHasNextPage)

      jest.spyOn(githubClient, 'fetchLabelPage').mockResolvedValueOnce(fetchedPageResponse)

      await pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })

      expect(localPage.isLastPage()).toBe(!updatedLabelPageHasNextPage)
    })
  })

  describe('when the query parameters are passed as a project item GraphQLPage', () => {
    let localPage: GraphQLPageMergeable<ProjectItem>
    let fetchedPagePOJO: GraphQLPagePOJO<ProjectItemPOJO>

    beforeEach(() => {
      localPage = new GraphQLPageMergeable<ProjectItem>(GithubObjectsTestData.getMergeableProjectItemPagePOJO(), ProjectItem)
      fetchedPagePOJO = GithubObjectsTestData.getLastProjectItemPagePOJO()
    })

    it('does not intercept errors thrown by the github API client', async () => {
      const error = new Error('mock failure')

      jest.spyOn(githubClient, 'fetchProjectItemPage').mockRejectedValue(error)

      await expect(pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })).rejects.toMatchObject(error)
    })

    it('appends the values from the retrieved page to the local project item page', async () => {
      const appendedProjectItemId = fetchedPagePOJO.edges[0].node.id
      const fetchedPageResponse: ProjectItemPageResponse = {
        node: {
          projectItems: fetchedPagePOJO
        }
      }

      expect(localPage.getNodeArray().length).toBe(2)

      jest.spyOn(githubClient, 'fetchProjectItemPage').mockResolvedValueOnce(fetchedPageResponse)

      await pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })

      const updatedPageNodes = localPage.getNodeArray()

      expect(updatedPageNodes.length).toBe(3)
      expect(updatedPageNodes.find((projectItem) => {
        return projectItem.getId() === appendedProjectItemId
      })).not.toBe(undefined)
    })

    it('converts the nodes of the fetched page to ProjectItem objects', async () => {
      const fetchedPageResponse: ProjectItemPageResponse = {
        node: {
          projectItems: fetchedPagePOJO
        }
      }

      jest.spyOn(githubClient, 'fetchProjectItemPage').mockResolvedValueOnce(fetchedPageResponse)

      await pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })

      for (const node of localPage.getNodeArray()) {
        expect(node instanceof ProjectItem).toBe(true)
      }
    })

    it('updates the end cursor of the local project item page to the value of the retrieved page', async () => {
      const updatedProjectItemPageEndCursor = fetchedPagePOJO.pageInfo.endCursor
      const fetchedPageResponse: ProjectItemPageResponse = {
        node: {
          projectItems: fetchedPagePOJO
        }
      }

      expect(localPage.getEndCursor()).not.toBe(updatedProjectItemPageEndCursor)

      jest.spyOn(githubClient, 'fetchProjectItemPage').mockResolvedValueOnce(fetchedPageResponse)

      await pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })

      expect(localPage.getEndCursor()).toBe(updatedProjectItemPageEndCursor)
    })

    it('updates the hasNextPage value of the local project item page to the value of the retrieved page', async () => {
      const updatedProjectItemPageHasNextPage = fetchedPagePOJO.pageInfo.hasNextPage
      const fetchedPageResponse: ProjectItemPageResponse = {
        node: {
          projectItems: fetchedPagePOJO
        }
      }

      expect(localPage.isLastPage()).not.toBe(!updatedProjectItemPageHasNextPage)

      jest.spyOn(githubClient, 'fetchProjectItemPage').mockResolvedValueOnce(fetchedPageResponse)

      await pageAssembler.fetchAdditionalSearchSpace({
        parentId: '',
        localPage
      })

      expect(localPage.isLastPage()).toBe(!updatedProjectItemPageHasNextPage)
    })
  })

  describe('when the query parameters are passed as an Issue', () => {
    let issue: Issue
    let fetchedPagePOJO: ExtendedColumnNameSearchSpaceResponse

    beforeEach(() => {
      issue = new Issue(GithubObjectsTestData.getIssuePOJOWithOnlyIncompleteChildPages())
      fetchedPagePOJO = {
        node: GithubObjectsTestData.getExtendedColumnNameSearchSpace()
      }
    })

    it('does not intercept errors thrown by the github API client', async () => {
      const error = new Error('mock failure')

      jest.spyOn(githubClient, 'fetchExpandedColumnNameSearchSpace').mockRejectedValue(error)

      await expect(pageAssembler.fetchAdditionalSearchSpace(issue)).rejects.toMatchObject(error)
    })

    it('adds new values from the retrieved pages to the local project item page', async () => {
      const issueProjectItems = issue.getProjectItemPage()
      const newProjectItemId = fetchedPagePOJO.node.projectItems.edges[2].node.id

      expect(issueProjectItems.getNodeArray().length).toBe(2)

      jest.spyOn(githubClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(fetchedPagePOJO)

      await pageAssembler.fetchAdditionalSearchSpace(issue)

      const updatedPageNodes = issueProjectItems.getNodeArray()

      expect(updatedPageNodes.length).toBe(3)
      expect(updatedPageNodes.find((projectItem) => {
        return projectItem.getId() === newProjectItemId
      })).not.toBe(undefined)
    })

    it('converts the nodes of the fetched project item page to ProjectItem objects', async () => {
      jest.spyOn(githubClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(fetchedPagePOJO)

      await pageAssembler.fetchAdditionalSearchSpace(issue)

      const updatedPageNodes = issue.getProjectItemPage().getNodeArray()

      for (const node of updatedPageNodes) {
        expect(node instanceof ProjectItem).toBe(true)
      }
    })

    it('does not restore locally deleted project items', async () => {
      const issueProjectItems = issue.getProjectItemPage()
      const newProjectItemId = fetchedPagePOJO.node.projectItems.edges[1].node.id

      issueProjectItems.delete(1)

      expect(issueProjectItems.getNodeArray().length).toBe(1)

      jest.spyOn(githubClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(fetchedPagePOJO)

      await pageAssembler.fetchAdditionalSearchSpace(issue)

      const updatedPageNodes = issueProjectItems.getNodeArray()

      expect(updatedPageNodes.length).toBe(2)
      expect(updatedPageNodes.find((projectItem) => {
        return projectItem.getId() === newProjectItemId
      })).toBe(undefined)
    })

    it('updates the end cursor of the local project item page to the value of the retrieved page', async () => {
      const projectItemPage = issue.getProjectItemPage()
      const updatedProjectItemPageEndCursor = fetchedPagePOJO.node.projectItems.pageInfo.endCursor

      expect(projectItemPage.getEndCursor()).not.toBe(updatedProjectItemPageEndCursor)

      jest.spyOn(githubClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(fetchedPagePOJO)

      await pageAssembler.fetchAdditionalSearchSpace(issue)

      expect(projectItemPage.getEndCursor()).toBe(updatedProjectItemPageEndCursor)
    })

    it('updates the hasNextPage value of the local project item page to the value of the retrieved page', async () => {
      const projectItemPage = issue.getProjectItemPage()
      const updatedProjectItemPageHasNextPage  = fetchedPagePOJO.node.projectItems.pageInfo.hasNextPage

      expect(projectItemPage.isLastPage()).not.toBe(!updatedProjectItemPageHasNextPage)

      jest.spyOn(githubClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(fetchedPagePOJO)

      await pageAssembler.fetchAdditionalSearchSpace(issue)

      expect(projectItemPage.isLastPage()).toBe(!updatedProjectItemPageHasNextPage)
    })

    describe('the child field value pages of the project items', () => {
      it('adds new values from the retrieved field value pages to the local field value pages', async () => {
        const issueProjectItems = issue.getProjectItemPage()
        const newFieldValueName = fetchedPagePOJO.node.projectItems.edges[0].node.fieldValues.edges[3].node.name
        const fetchedPageResponse: ExtendedColumnNameSearchSpaceResponse = fetchedPagePOJO

        expect(issueProjectItems.getNodeArray()[0].getFieldValuePage().getNodeArray().length).toBe(0)

        jest.spyOn(githubClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(fetchedPageResponse)

        await pageAssembler.fetchAdditionalSearchSpace(issue)

        expect(issueProjectItems.getNodeArray()[0].getFieldValuePage().getNodeArray().length).toBe(1)
        expect(issueProjectItems.getNodeArray()[0].getFieldValuePage().getNodeArray().find((fieldValue) => {
          return fieldValue.getName() === newFieldValueName
        })).not.toBe(undefined)
      })

      it('converts the nodes of the fetched field value pages to FieldValue objects', async () => {
        const fetchedPageResponse: ExtendedColumnNameSearchSpaceResponse = fetchedPagePOJO

        jest.spyOn(githubClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(fetchedPageResponse)

        await pageAssembler.fetchAdditionalSearchSpace(issue)

        const updatedProjectItemPageNodes = issue.getProjectItemPage().getNodeArray()

        for (const projectItemNode of updatedProjectItemPageNodes) {
          for (const fieldValueNode of projectItemNode.getFieldValuePage().getNodeArray()) {
            expect(fieldValueNode instanceof FieldValue).toBe(true)
          }
        }
      })

      it('updates the end cursors of the local field value pages to the values of the retrieved pages', async () => {
        const projectItemPage = issue.getProjectItemPage()
        const firstUpdatedEndCursor = fetchedPagePOJO.node.projectItems.edges[0].node.fieldValues.pageInfo.endCursor
        const secondsUpdatedEndCursor = fetchedPagePOJO.node.projectItems.edges[1].node.fieldValues.pageInfo.endCursor

        expect(projectItemPage.getNodeArray()[0].getFieldValuePage().getEndCursor()).not.toBe(firstUpdatedEndCursor)
        expect(projectItemPage.getNodeArray()[1].getFieldValuePage().getEndCursor()).not.toBe(secondsUpdatedEndCursor)

        jest.spyOn(githubClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(fetchedPagePOJO)

        await pageAssembler.fetchAdditionalSearchSpace(issue)

        expect(projectItemPage.getNodeArray()[0].getFieldValuePage().getEndCursor()).toBe(firstUpdatedEndCursor)
        expect(projectItemPage.getNodeArray()[1].getFieldValuePage().getEndCursor()).toBe(secondsUpdatedEndCursor)
      })

      it('updates the hasNextPage values of the local field value pages to the values of the retrieved pages', async () => {
        const projectItemPage = issue.getProjectItemPage()
        const firstUpdatedHasNextPage = fetchedPagePOJO.node.projectItems.edges[0].node.fieldValues.pageInfo.hasNextPage
        const secondsUpdatedHasNextPage = fetchedPagePOJO.node.projectItems.edges[1].node.fieldValues.pageInfo.hasNextPage

        expect(projectItemPage.getNodeArray()[0].getFieldValuePage().isLastPage()).not.toBe(!firstUpdatedHasNextPage)
        expect(projectItemPage.getNodeArray()[1].getFieldValuePage().isLastPage()).not.toBe(!secondsUpdatedHasNextPage)

        jest.spyOn(githubClient, 'fetchExpandedColumnNameSearchSpace').mockResolvedValueOnce(fetchedPagePOJO)

        await pageAssembler.fetchAdditionalSearchSpace(issue)

        expect(projectItemPage.getNodeArray()[0].getFieldValuePage().isLastPage()).toBe(!firstUpdatedHasNextPage)
        expect(projectItemPage.getNodeArray()[1].getFieldValuePage().isLastPage()).toBe(!secondsUpdatedHasNextPage)
      })
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