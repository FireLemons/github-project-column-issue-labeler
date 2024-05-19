import { GraphQLPage, Issue } from '../src/githubObjects'

const fieldValuePOJO = {
  "name": "Todo"
}

const fieldValuePOJOPage = {
  edges: [
    {
      node: {}
    },
    {
      node: fieldValuePOJO
    }
  ],
  pageInfo: {
    endCursor: "MQ",
    hasNextPage: true
  }
}

const labelPOJO = {
  name: "help wanted"
}

const labelPOJOPage = {
  edges: [
    {
      node: labelPOJO
    }
  ],
  pageInfo: {
    endCursor: "MQ",
    hasNextPage: true
  }
}

const projectItemPOJO = {
  fieldValues: fieldValuePOJOPage
}

const projectPOJOItemPage = {
  edges: [
    {
      node: projectItemPOJO
    }
  ],
  pageInfo: {
    endCursor: "MQ",
    hasNextPage: false
  }
}

const issuePOJO =  {
  number: 1,
  labels: labelPOJOPage,
  projectItems: projectPOJOItemPage
}

const issuePOJOPage = {
  edges: [
    {
      node: issuePOJO
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
      const nearlyPageObject: { edges: any, pageInfo: { endCursor: string, hasNextPage?: boolean} } = structuredClone(issuePOJOPage)
      delete nearlyPageObject['pageInfo']['hasNextPage']

      expect(() => {
        new GraphQLPage<Issue>(nearlyPageObject)
      }).toThrow(TypeError)
    })

    test('does not throw an error when passed a page', () => {
      const normalPage = structuredClone(projectPOJOItemPage)

      expect(() => {
        new GraphQLPage(normalPage)
      }).not.toThrow(TypeError)
    })
  })
})