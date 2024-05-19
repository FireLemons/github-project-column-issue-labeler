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

describe('The FieldValue class', () => {
  describe('constructor', () => {
    it('throws an error when passed a non object value')
    it('throws an error when passed an object not matching a field value')
    it('successfully constructs the FieldValue when passed a valid object')
  })

  describe('getName()', () => {
    it('returns the name of the FieldValue instance')
  })
})

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

    test('it throws an error when passed an object not matching the structure of a page', () => {
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

  describe('getEdges()', () => {
    it('returns the edges of the graphQL page')
  })

  describe('getEndCursor()', () => {
    it('returns the end cursor of the graphQL page')
  })

  describe('getNodeArray()', () => {
    it('returns the nodes of the graphQL page as an array')
  })

  describe('getPageInfo()', () => {
    it('returns the page info of the graphQL page')
  })

  describe('isEmpty()', () => {
    it('returns true if the page does not have nodes')
    it('returns false if the page has nodes')
  })

  describe('isLastPage()', () => {
    it('returns true if the pageInfo indicates the page is the last page')
    it('returns false if the pageInfo indicates the page is not the last page')
  })
})

describe('The Issue class', () => {
  describe('constructor', () => {
    it('throws an error when passed a non object value')
    it('throws an error when passed an object not matching an issue')
    it('throws an error when passed an issue object with an invalid project item page')
    it('successfully constructs the Issue when passed a valid object')
    it('successfully constructs the Issue when passed an issue object with an invalid label page')
  })

  describe('findColumnName()', () => {
    it('returns false if the column name could not be found with complete pages')
    it('throws an error if the could name could not be found with incomplete pages')
    it('returns true if the column name could be found')
  })

  describe('getId()', () => {
    it('returns the id of the Issue instance')
  })
  
  describe('getLabels()', () => {
    it('returns the labels of the Issue instance as an array')
  })

  describe('getNumber()', () => {
    it('returns the number of the Issue instance')
  })
})

describe('The Label class', () => {
  describe('constructor', () => {
    it('throws an error when passed a non object value')
    it('throws an error when passed an object not matching a label')
    it('successfully constructs the Label when passed a valid object')
  })

  describe('getName()', () => {
    it('returns the name of the Label instance')
  })
})

describe('The ProjectItem class', () => {
  describe('constructor', () => {
    it('throws an error when passed a non object value')
    it('throws an error when passed an object not matching a project item')
    it('throws an error when passed a project item object with an invalid field value page')
    it('successfully constructs the ProjectItem when passed a valid object')
  })

  describe('findColumnName()', () => {
    it('returns false if the column name could not be found with complete pages')
    it('throws an error if the could name could not be found with incomplete pages')
    it('returns true if the column name could be found')
  })
})

describe('initializeNodes()', () => {
  it('converts all valid nodes to instances of the class parameter')
  it('discards edges containing nodes that could not be instantiated')
})