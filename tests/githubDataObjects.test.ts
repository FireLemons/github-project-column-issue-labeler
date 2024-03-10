import { GraphQLPage, IssueWithChildPages } from '../src/githubObjects'

const columnNamePage = {
  edges: [
    {
      node: {}
    }
  ],
  pageInfo: {
    endCursor: "MQ",
    hasNextPage: true
  }
}

const projectItemPage = {
  edges: [
    {
      node: {
        fieldValues: columnNamePage
      }
    }
  ],
  pageInfo: {
    endCursor: "MQ",
    hasNextPage: false
  }
}

const labelPage = {
  edges: [
    {
      node: {
        name: "help wanted"
      }
    }
  ],
  pageInfo: {
    endCursor: "MQ",
    hasNextPage: true
  }
}

const issuePage = {
  edges: [
    {
      node: {
        id: "id string",
        labels: labelPage,
        projectItems: projectItemPage
      }
    }
  ],
  pageInfo: {
    endCursor: "cursor",
    hasNextPage: true
  }
}

describe('The GraphQLPage class', () => {
  describe('constructor', () => {
    test('it throws an error when not passed an object', () => {
      expect(() => {
        new GraphQLPage('')
      }).toThrow(TypeError)

      expect(() => {
        new GraphQLPage(2)
      }).toThrow(TypeError)

      expect(() => {
        new GraphQLPage([])
      }).toThrow(TypeError)

      expect(() => {
        new GraphQLPage(null)
      }).toThrow(TypeError)
    })

    test('it throws an error when passed almost a page object', () => {
      const nearlyPageObject: { edges: any, pageInfo: { endCursor: string, hasNextPage?: boolean} } = structuredClone(issuePage)
      delete nearlyPageObject['pageInfo']['hasNextPage']

      expect(() => {
        new GraphQLPage<IssueWithChildPages>(nearlyPageObject)
      }).toThrow(TypeError)
    })

    test('does not throw an error when passed a page', () => {
      const normalPage = structuredClone(projectItemPage)

      expect(() => {
        new GraphQLPage(normalPage)
      }).not.toThrow(TypeError)
    })
  })
})