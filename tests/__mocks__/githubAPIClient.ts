export const mockFetchExpandedColumnNameSearchSpace = jest.fn()
export const mockFetchFieldValuePage = jest.fn()
export const mockFetchIssuePage = jest.fn()
export const mockFetchLabelPage = jest.fn()
export const mockFetchProjectItemPage = jest.fn()

const mockGithubAPIClient = jest.fn().mockImplementation(() => {
  return {
    fetchExpandedColumnNameSearchSpace: mockFetchExpandedColumnNameSearchSpace,
    fetchFieldValuePage: mockFetchFieldValuePage,
    fetchIssuePage: mockFetchIssuePage,
    fetchLabelPage: mockFetchLabelPage,
    fetchProjectItemPage: mockFetchProjectItemPage
  }
})

export default mockGithubAPIClient