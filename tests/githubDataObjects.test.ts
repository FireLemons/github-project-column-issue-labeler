import { FieldValue, GraphQLPage, Issue } from '../src/githubObjects'

const fieldValuePOJO = {
  "name": "AnSVq5a_ibi2E*M<|/>'"
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
    endCursor: "UjLu&s>'NWO+eo_Z|Cg(",
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
    it('throws an error when passed a non object value', () => {
      expect(() => {
        new FieldValue(3)
      }).toThrow()
    })

    it('throws an error when passed an object not matching a field value', () => {
      expect(() => {
        new FieldValue({})
      }).toThrow()
    })

    it('successfully constructs the FieldValue when passed a valid object', () => {
      expect(() => {
        new FieldValue(fieldValuePOJO)
      }).not.toThrow()
    })
  })

  describe('getName()', () => {
    it('returns the name of the FieldValue instance', () => {
      const fieldValue = new FieldValue(fieldValuePOJO)

      expect(fieldValue.getName()).toBe(fieldValuePOJO.name)
    })
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

    test('it throws an error when passed an object not matching a graphQL page', () => {
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
    it('returns the edges of the graphQL page', () => {
      const page = new GraphQLPage(labelPOJOPage)

      expect(page.getEdges()).toBe(labelPOJOPage.edges)
    })
  })

  describe('getEndCursor()', () => {
    it('returns the end cursor of the graphQL page', () => {
      const page = new GraphQLPage(labelPOJOPage)

      expect(page.getEndCursor()).toBe(labelPOJOPage.pageInfo.endCursor)
    })
  })

  describe('getNodeArray()', () => {
    it('returns the nodes of the graphQL page as an array', () => {
      const page = new GraphQLPage(fieldValuePOJOPage)

      expect(page.getNodeArray()).toEqual([
        {},
        fieldValuePOJO
      ])
    })
  })

  describe('getPageInfo()', () => {
    it('returns the page info of the graphQL page', () => {
      const page = new GraphQLPage(labelPOJOPage)

      expect(page.getPageInfo()).toBe(labelPOJOPage.pageInfo)
    })
  })

  describe('isEmpty()', () => {
    it('returns true if the page does not have nodes', () => {
      const labelPOJOPageCopy = structuredClone(labelPOJOPage)

      labelPOJOPageCopy.edges = []

      const labelPage = new GraphQLPage(labelPOJOPageCopy)

      expect(labelPage.isEmpty()).toBeTruthy()
    })

    it('returns false if the page has nodes', () => {
      const labelPage = new GraphQLPage(labelPOJOPage)

      expect(labelPage.isEmpty()).toBeFalsy()
    })
  })

  describe('isLastPage()', () => {
    it('returns true if the pageInfo indicates the page is the last page', () => {
      const labelPOJOPageCopy = structuredClone(labelPOJOPage)

      labelPOJOPageCopy.pageInfo.hasNextPage = false

      const labelPage = new GraphQLPage(labelPOJOPageCopy)

      expect(labelPage.isLastPage()).toBeTruthy()
    })

    it('returns false if the pageInfo indicates the page is not the last page', () => {
      const labelPage = new GraphQLPage(labelPOJOPage)

      expect(labelPage.isLastPage()).toBeFalsy()
    })
  })
})

describe('The Issue class', () => {
  describe('constructor', () => {
    it('throws an error when passed a non object value', () => {
      
    })

    it('throws an error when passed an object not matching an issue', () => {
      
    })

    it('throws an error when passed an issue object with an invalid project item page', () => {
      
    })

    it('successfully constructs the Issue when passed a valid object', () => {
      
    })

    it('successfully constructs the Issue when passed an issue object with an invalid label page', () => {
      
    })
  })

  describe('findColumnName()', () => {
    it('returns false if the column name could not be found with complete pages', () => {
      
    })

    it('throws an error if the could name could not be found with incomplete pages', () => {
      
    })

    it('returns true if the column name could be found', () => {
      
    })
  })

  describe('getId()', () => {
    it('returns the id of the Issue instance', () => {
      
    })
  })
  
  describe('getLabels()', () => {
    it('returns the labels of the Issue instance as an array', () => {
      
    })
  })

  describe('getNumber()', () => {
    it('returns the number of the Issue instance', () => {
      
    })
  })
})

describe('The Label class', () => {
  describe('constructor', () => {
    it('throws an error when passed a non object value', () => {
      
    })

    it('throws an error when passed an object not matching a label', () => {
      
    })

    it('successfully constructs the Label when passed a valid object', () => {
      
    })
  })

  describe('getName()', () => {
    it('returns the name of the Label instance', () => {
      
    })
  })
})

describe('The ProjectItem class', () => {
  describe('constructor', () => {
    it('throws an error when passed a non object value', () => {
      
    })

    it('throws an error when passed an object not matching a project item', () => {
      
    })

    it('throws an error when passed a project item object with an invalid field value page', () => {
      
    })

    it('successfully constructs the ProjectItem when passed a valid object', () => {
      
    })
  })

  describe('findColumnName()', () => {
    it('returns false if the column name could not be found with complete pages', () => {
      
    })

    it('throws an error if the could name could not be found with incomplete pages', () => {
      
    })

    it('returns true if the column name could be found', () => {
      
    })
  })
})

describe('initializeNodes()', () => {
  it('converts all valid nodes to instances of the class parameter', () => {
      
  })

  it('discards edges containing nodes that could not be instantiated', () => {
      
  })
})