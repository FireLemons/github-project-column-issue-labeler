function mockFetchExpandedColumnNameSearchSpace () {
  throw new Error('Unexpected mock call')
}

function mockFetchFieldValuePage () {
  throw new Error('Unexpected mock call')
}

function mockFetchIssuePage () {
  throw new Error('Unexpected mock call')
}

function mockFetchLabelPage () {
  throw new Error('Unexpected mock call')
}

function mockFetchProjectItemPage () {
  throw new Error('Unexpected mock call')
}

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