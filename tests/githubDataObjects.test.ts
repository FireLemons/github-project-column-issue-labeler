import { FieldValue, GraphQLPage, Issue, Label, ProjectItem, initializeNodes } from '../src/githubObjects'

const fieldValuePOJO = {
  name: 'AnSVq5a_ibi2E*M<|/>'
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
    endCursor: 'MQ',
    hasNextPage: true
  }
}

const labelPOJO = {
  name: '5~hg?<[kjHwGhUII-p:'
}

const labelPOJOPage = {
  edges: [
    {
      node: labelPOJO
    }
  ],
  pageInfo: {
    endCursor: 'UjLu&s>NWO+eo_Z|Cg(',
    hasNextPage: true
  }
}

const projectItemPOJO = {
  databaseId: 65248239,
  fieldValues: fieldValuePOJOPage,
  project: {
    title: 'y%O/"!D%ZvpvkD$2cw_W'
  },
}

const projectItemPOJOPage = {
  edges: [
    {
      node: projectItemPOJO
    }
  ],
  pageInfo: {
    endCursor: 'MQ',
    hasNextPage: false
  }
}

const issuePOJO =  {
  number: 1009,
  labels: labelPOJOPage,
  projectItems: projectItemPOJOPage
}

const issuePOJOPage = {
  edges: [
    {
      node: issuePOJO
    }
  ],
  pageInfo: {
    endCursor: 'cursor',
    hasNextPage: true
  }
}

function addNodes (page: any, nodes: any[] | any) {
  if (Array.isArray(nodes)) {
    page.edges.push(...nodes.map((node) => {
      return {
        node: node
      }
    }))
  } else {
    page.edges.push({
      node: nodes
    })
  }
}

describe('The FieldValue class', () => {
  describe('constructor', () => {
    it('throws an error when passed a non object value', () => {
      expect(() => {
        new FieldValue(3)
      }).toThrow(TypeError)
    })

    it('throws an error when passed an object not matching a field value', () => {
      expect(() => {
        new FieldValue({})
      }).toThrow(TypeError)
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
      const normalPage = structuredClone(projectItemPOJOPage)

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
  beforeEach(() => { // The Issue constructor mutates the projectItemPOJO sub-object. This avoids the mutation persisting through to other tests
    projectItemPOJOPage.edges[0].node = structuredClone(projectItemPOJO)
  })

  afterEach(() => {
    projectItemPOJOPage.edges[0].node = projectItemPOJO
  })

  describe('constructor', () => {
    it('throws an error when passed a non object value', () => {
      expect(() => {
        new Issue(2)
      }).toThrow(TypeError)
    })

    it('throws an error when passed an object not matching an issue', () => {
      expect(() => {
        new Issue({
          number: 1,
          labels: 'wrong type for labels value',
          projectItems: projectItemPOJOPage
        })
      }).toThrow(TypeError)
    })

    it('throws an error when passed an issue object with an invalid project item page', () => {
      expect(() => {
        new Issue({
          number: 1,
          labels: labelPOJOPage,
          projectItems: {
            pageInfo: null
          }
        })
      }).toThrow(ReferenceError)
    })

    it('successfully constructs the Issue when passed a valid object', () => {
      expect(() => {
        new Issue(issuePOJO)
      }).not.toThrow()
    })

    it('successfully constructs the Issue when passed an issue object with an invalid label page', () => {
      expect(() => {
        new Issue({
          number: 1,
          labels: {
            pageInfo: null
          },
          projectItems: projectItemPOJOPage
        })
      }).not.toThrow()
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
  
  describe('getLabels()', () => {
    it('returns the labels of the Issue instance as an array', () => {
      const issuePOJOCopy = structuredClone(issuePOJO)

      addNodes(issuePOJOCopy.labels, [
        {
          name: 'jC8?&U0V`Cch4)II/10#'
        },
        {
          name: 'lA0$,&jb.>d<Hi3{*[B'
        }
      ])

      const issue = new Issue(issuePOJOCopy)

      expect(issue.getLabels()).toEqual(expect.arrayContaining(['jC8?&U0V`Cch4)II/10#', 'lA0$,&jb.>d<Hi3{*[B', '5~hg?<[kjHwGhUII-p:']))
    })

    it('returns null when the label page cannot be initialized', () => {
      const issuePOJOCopy: any = structuredClone(issuePOJO)

      issuePOJOCopy.labels = {}

      const issue = new Issue(issuePOJOCopy)

      expect(issue.getLabels()).toBe(null)
    })
  })

  describe('getNumber()', () => {
    it('returns the number of the Issue instance', () => {
      const issue = new Issue(issuePOJO)

      expect(issue.getNumber()).toBe(issuePOJO.number)
    })
  })
})

describe('The Label class', () => {
  describe('constructor', () => {
    it('throws an error when passed a non object value', () => {
      expect(() => {
        new Label(3)
      }).toThrow(TypeError)
    })

    it('throws an error when passed an object not matching a label', () => {
      expect(() => {
        new Label({})
      }).toThrow(TypeError)
    })

    it('successfully constructs the Label when passed a valid object', () => {
      expect(() => {
        new Label(labelPOJO)
      }).not.toThrow()
    })
  })

  describe('getName()', () => {
    it('returns the name of the Label instance', () => {
      const label = new Label(labelPOJO)

      expect(label.getName()).toBe(labelPOJO.name)
    })
  })
})

describe('The ProjectItem class', () => {
  describe('constructor', () => {
    it('throws an error when passed a non object value', () => {
      expect(() => {
        new ProjectItem(3)
      }).toThrow(TypeError)
    })

    it('throws an error when passed an object not matching a project item', () => {
      expect(() => {
        new ProjectItem({})
      }).toThrow(TypeError)
    })

    it('throws an error when passed a project item object with an invalid field value page', () => {
      const projectItemPOJOCopy: any = structuredClone(projectItemPOJO)

      projectItemPOJOCopy.fieldValues = {}

      expect(() => {
        new ProjectItem(projectItemPOJOCopy)
      }).toThrow(ReferenceError)
    })

    it('successfully constructs the ProjectItem when passed a valid object', () => {
      expect(() => {
        new ProjectItem(structuredClone(projectItemPOJO))
      }).not.toThrow()
    })
  })

  describe('findColumnName()', () => {
    it('returns null if the column name could not be found with complete pages', () => {
      const projectItemPOJOCopy = structuredClone(projectItemPOJO)

      projectItemPOJOCopy.fieldValues.pageInfo.hasNextPage = false
      projectItemPOJOCopy.fieldValues.edges.splice(1, 1)

      const projectItem = new ProjectItem(projectItemPOJOCopy)

      expect(projectItem.findColumnName()).toBe(null)
    })

    it('throws an error if the could name could not be found with incomplete pages', () => {
      const projectItemPOJOCopy = structuredClone(projectItemPOJO)

      projectItemPOJOCopy.fieldValues.edges.splice(1, 1)

      const projectItem = new ProjectItem(projectItemPOJOCopy)

      expect(() => {
        projectItem.findColumnName()
      }).toThrow(ReferenceError)
    })

    it('returns true if the column name could be found', () => {
      const projectItemPOJOCopy = structuredClone(projectItemPOJO)

      projectItemPOJOCopy.fieldValues.pageInfo.hasNextPage = false

      const projectItem = new ProjectItem(projectItemPOJOCopy)

      expect(projectItem.findColumnName()).toBe(fieldValuePOJO.name)
    })
  })

  describe('getId()', () => {
    it('returns the id of the project item', () => {
      const projectItem = new ProjectItem(structuredClone(projectItemPOJO))

      expect(projectItem.getId()).toBe(projectItemPOJO.databaseId)
    })
  })

  describe('getProjectName()', () => {
    it('returns the name of the ProjectItem\'s parent project', () => {
      const projectItem = new ProjectItem(structuredClone(projectItemPOJO))

      expect(projectItem.getProjectName()).toBe(projectItemPOJO.project.title)
    })
  })
})

describe('initializeNodes()', () => {
  it('converts all valid nodes to instances of the class parameter', () => {
    const fieldValuePOJOPageCopy = structuredClone(fieldValuePOJOPage)
    const fieldValuePOJO2 = {
      name: '+=Xh(TZCqK}e\@]O1s[@'
    }

    fieldValuePOJOPageCopy.edges.push({
      node: fieldValuePOJO2
    })

    const graphQLPage = new GraphQLPage(fieldValuePOJOPageCopy)

    initializeNodes(FieldValue, graphQLPage)

    const instantiatedNodes = graphQLPage.getNodeArray()

    expect(instantiatedNodes.find((node) => {
      return node instanceof FieldValue && node.getName() === fieldValuePOJO.name
    })).not.toBe(undefined)

    expect(instantiatedNodes.find((node) => {
      return node instanceof FieldValue && node.getName() === fieldValuePOJO2.name
    })).not.toBe(undefined)
  })

  it('discards edges containing nodes that could not be instantiated', () => {
    const fieldValuePOJOPageCopy = structuredClone(fieldValuePOJOPage)
    const fieldValuePOJOInvalid: any = {
      columnName: '+=Xh(TZCqK}e\@]O1s[@'
    }

    fieldValuePOJOPageCopy.edges.push({
      node: fieldValuePOJOInvalid
    })

    const graphQLPage = new GraphQLPage(fieldValuePOJOPageCopy)

    initializeNodes(FieldValue, graphQLPage)

    const instantiatedNodes = graphQLPage.getNodeArray()

    expect(instantiatedNodes.find((node) => {
      return node instanceof FieldValue && node.getName() === fieldValuePOJO.name
    })).not.toBe(undefined)

    expect(instantiatedNodes.find((node) => {
      return node instanceof FieldValue && node.getName() === fieldValuePOJOInvalid.name
    })).toBe(undefined)

    expect(instantiatedNodes.length).toBe(1)
  })
})
