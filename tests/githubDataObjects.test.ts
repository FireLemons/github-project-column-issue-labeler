import { GraphQLPage, IssueWithChildPages } from '../src/githubObjects'

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
      const nearlyPageObject: { edges: any, pageInfo: { endCursor: string, hasNextPage?: boolean} } = {
        edges: [
          {
            node: {
              id: "id string",
              labels: {
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
              },
              projectItems: {
                edges: [
                  {
                    node: {
                      fieldValues: {
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
                    }
                  }
                ],
                pageInfo: {
                  endCursor: "MQ",
                  hasNextPage: false
                }
              }
            }
          }
        ],
        pageInfo: {
          endCursor: "cursor",
          hasNextPage: true
        }
      }

      delete nearlyPageObject['pageInfo']['hasNextPage']

      expect(() => {
        new GraphQLPage<IssueWithChildPages>(nearlyPageObject)
      }).toThrow(TypeError)
    })

    test('does not throw an error when passed a page', () => {
      const normalPage = {
        edges: [
          {
            node: {
              fieldValues: {
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
            }
          }
        ],
        pageInfo: {
          endCursor: "MQ",
          hasNextPage: false
        }
      }

      expect(() => {
        new GraphQLPage(normalPage)
      }).not.toThrow(TypeError)
    })
  })
})