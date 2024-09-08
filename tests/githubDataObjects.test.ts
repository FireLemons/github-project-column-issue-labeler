import { FieldValue, GraphQLPage, GraphQLPageMergeable, Issue, Label, ProjectItem, RecordWithID, RemoteRecordPageQueryParameters, initializeNodes } from '../src/githubObjects'
import * as TypeChecker from '../src/typeChecker'

const fieldValuePOJO = {
  name: 'AnSVq5a_ibi2E*M<|/>'
}

const fieldValuePagePOJO = {
  edges: [
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

const labelPagePOJO = {
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

const projectPOJO = {
  number: 1,
  owner: {
    login: "29;UhhP@%nooLB#ms"
  }
}

const projectItemPOJO = {
  databaseId: 65248239,
  fieldValues: fieldValuePagePOJO,
  project: projectPOJO
}

const projectItemPagePOJO = {
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

const issuePOJO = {
  number: 1009,
  labels: labelPagePOJO,
  projectItems: projectItemPagePOJO
}

const issuePagePOJO = {
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
    it('throws an error when not passed an object', () => {
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

    it('throws an error when passed an object not matching a graphQL page', () => {
      const nearlyPageObject: { edges: any, pageInfo: { endCursor: string, hasNextPage?: boolean} } = structuredClone(issuePagePOJO)
      delete nearlyPageObject['pageInfo']['hasNextPage']

      expect(() => {
        new GraphQLPage<Issue>(nearlyPageObject)
      }).toThrow(TypeError)
    })

    it('does not throw an error when passed a page', () => {
      const normalPage = structuredClone(projectItemPagePOJO)

      expect(() => {
        new GraphQLPage(normalPage)
      }).not.toThrow(TypeError)
    })

    it('can toggle issue paged between project and non project mode', () => {
      const issuePagePOJOCopy = structuredClone(issuePagePOJO)
      const issuePageProjectsDisabled = new GraphQLPage<Issue>(issuePagePOJOCopy, Issue, false)
      const issuesWithProjectsDisabled = issuePageProjectsDisabled.getNodeArray()
      expect(issuesWithProjectsDisabled.length).not.toBe(0)
      expect(issuesWithProjectsDisabled[0].columnNameMap).not.toBe(undefined)
      expect(issuesWithProjectsDisabled[0].columnName).toBe(undefined)

      const issuePagePOJOCopy2 = structuredClone(issuePagePOJO)
      const issuePageProjectsEnabled = new GraphQLPage<Issue>(issuePagePOJOCopy2, Issue, true)
      const issuesWithProjectsEnabled = issuePageProjectsEnabled.getNodeArray()
      expect(issuesWithProjectsEnabled.length).not.toBe(0)
      expect(issuesWithProjectsEnabled[0].columnNameMap).not.toBe(undefined)
      expect(issuesWithProjectsEnabled[0].columnName).toBe(undefined)
    })
  })

  describe('appendPage()', () => {
    let combinedPage: GraphQLPage<FieldValue>
    const appendedPageFieldValueName = '~o9{5S/WT|<>FLuMS'
    const appendedPageEndCursor = 'D=if(!.SUZ+H=h"+Ae'

    beforeAll(() => {
      combinedPage = new GraphQLPage<FieldValue>(structuredClone(fieldValuePagePOJO))
      const appendedPageFieldValuePOJO = structuredClone(fieldValuePagePOJO)

      appendedPageFieldValuePOJO.edges[0].node.name = appendedPageFieldValueName
      appendedPageFieldValuePOJO.pageInfo = {
        endCursor: appendedPageEndCursor,
        hasNextPage: false
      }

      const appendedPage = new GraphQLPage<FieldValue>(appendedPageFieldValuePOJO)

      combinedPage.appendPage(appendedPage)
    })

    it('appends the edges from the page passed as an argument to the page', () => {
      expect(combinedPage.getEdges().find((edge) => {
        return edge.node.name === fieldValuePOJO.name
      })).not.toBe(undefined)

      expect(combinedPage.getEdges().find((edge) => {
        return edge.node.name === appendedPageFieldValueName
      })).not.toBe(undefined)
    })

    it('updates the pageInfo for the page with the pageInfo from the passed page', () => {
      const combinedPagePageInfo = combinedPage.getPageInfo()

      expect(combinedPagePageInfo.endCursor).toBe(appendedPageEndCursor)
      expect(combinedPagePageInfo.hasNextPage).toBe(false)
    })
  })

  describe('delete()', () => {
    it('removes the edge at the index passed from the graphQL page', () => {
      const fieldValuePagePOJOCopy = structuredClone(fieldValuePagePOJO)
      const newFieldValueName = '7ZM@fyoDrP!i8-mf(M'

      fieldValuePagePOJOCopy.edges.push({
        node: {
          name: newFieldValueName
        }
      })

      const page = new GraphQLPage<FieldValue>(fieldValuePagePOJOCopy, FieldValue)

      page.delete(1)

      const nodes = page.getNodeArray()

      expect(nodes.find((fieldValue) => {
        return fieldValue.name === fieldValuePOJO.name
      })).not.toBe(undefined)

      expect(nodes.find((fieldValue) => {
        return fieldValue.name === newFieldValueName
      })).toBe(undefined)

      page.delete(0)

      expect(page.isEmpty()).toBe(true)
    })

    it('returns the removed node', () => {
      const page = new GraphQLPage<FieldValue>(structuredClone(fieldValuePagePOJO), FieldValue)

      expect(page.delete(0).getName()).toBe(fieldValuePOJO.name)
    })

    it('throws an error when the index is out of bounds', () => {
      const page = new GraphQLPage<FieldValue>(structuredClone(fieldValuePagePOJO), FieldValue)

      expect(() => {
        page.delete(1)
      }).toThrow(RangeError)
    })
  })

  describe('getEdges()', () => {
    it('returns the edges of the graphQL page', () => {
      const page = new GraphQLPage(labelPagePOJO)

      expect(page.getEdges()).toBe(labelPagePOJO.edges)
    })
  })

  describe('getEndCursor()', () => {
    it('returns the end cursor of the graphQL page', () => {
      const page = new GraphQLPage(labelPagePOJO)

      expect(page.getEndCursor()).toBe(labelPagePOJO.pageInfo.endCursor)
    })
  })

  describe('getNodeArray()', () => {
    it('returns the nodes of the graphQL page as an array', () => {
      const page = new GraphQLPage(fieldValuePagePOJO)

      expect(page.getNodeArray()).toEqual([
        fieldValuePOJO
      ])
    })
  })

  describe('getPageInfo()', () => {
    it('returns the page info of the graphQL page', () => {
      const page = new GraphQLPage(labelPagePOJO)

      expect(page.getPageInfo()).toBe(labelPagePOJO.pageInfo)
    })
  })

  describe('isEmpty()', () => {
    it('returns true if the page does not have nodes', () => {
      const labelPagePOJOCopy = structuredClone(labelPagePOJO)

      labelPagePOJOCopy.edges = []

      const labelPage = new GraphQLPage(labelPagePOJOCopy)

      expect(labelPage.isEmpty()).toBeTruthy()
    })

    it('returns false if the page has nodes', () => {
      const labelPage = new GraphQLPage(labelPagePOJO)

      expect(labelPage.isEmpty()).toBeFalsy()
    })
  })

  describe('isLastPage()', () => {
    it('returns true if the pageInfo indicates the page is the last page', () => {
      const labelPagePOJOCopy = structuredClone(labelPagePOJO)

      labelPagePOJOCopy.pageInfo.hasNextPage = false

      const labelPage = new GraphQLPage(labelPagePOJOCopy)

      expect(labelPage.isLastPage()).toBeTruthy()
    })

    it('returns false if the pageInfo indicates the page is not the last page', () => {
      const labelPage = new GraphQLPage(labelPagePOJO)

      expect(labelPage.isLastPage()).toBeFalsy()
    })
  })
})

describe('The GraphQLPageMergeable class', () => {
  describe('delete()', () => {
    it('removes the edge at the index passed from the graphQL page', () => {
      const projectItemPagePOJOCopy = structuredClone(projectItemPagePOJO)
      const newProjectItemId = 38209138093218

      projectItemPagePOJOCopy.edges.push({
        node: {
          databaseId: newProjectItemId,
          fieldValues: structuredClone(fieldValuePagePOJO),
          project: {
            number: 2,
            owner: {
              login: ''
            }
          }
        }
      })

      const page = new GraphQLPageMergeable<ProjectItem>(projectItemPagePOJOCopy, ProjectItem)

      page.delete(1)

      const nodes = page.getNodeArray()

      expect(nodes.find((projectItem) => {
        return projectItem.getId() === projectItemPOJO.databaseId
      })).not.toBe(undefined)

      expect(nodes.find((projectItem) => {
        return projectItem.getId() === newProjectItemId
      })).toBe(undefined)

      page.delete(0)

      expect(page.isEmpty()).toBe(true)
    })

    it('returns the removed node', () => {
      const page = new GraphQLPageMergeable<ProjectItem>(structuredClone(projectItemPagePOJO), ProjectItem)

      expect(page.delete(0).getId()).toBe(projectItemPOJO.databaseId)
    })

    it('stores the id of deleted nodes', () => {
      const page = new GraphQLPageMergeable<ProjectItem>(structuredClone(projectItemPagePOJO), ProjectItem)

      expect(page.deletedNodeIds.has(projectItemPOJO.databaseId)).toBe(false)

      page.delete(0)

      expect(page.deletedNodeIds.has(projectItemPOJO.databaseId)).toBe(true)
    })
  })

  describe('merge()', () => {
    const existingProjectItemUpdatedFieldValueName = '6lY,9xOuv5VX0AUoE)'

    let existingProjectItemPOJO: typeof projectItemPOJO
    let newProjectItemPOJO: typeof projectItemPOJO
    let page: GraphQLPageMergeable<ProjectItem>
    let pageToBeMerged: GraphQLPageMergeable<ProjectItem>

    beforeEach(() => {
      const deletedProjectItemPOJO = structuredClone(projectItemPOJO)

      existingProjectItemPOJO = structuredClone(projectItemPOJO)

      existingProjectItemPOJO.databaseId = 90285654630
      existingProjectItemPOJO.fieldValues.edges = []
      existingProjectItemPOJO.project.owner.login = '#vuO;QJ@xywt@(Hy*#'

      newProjectItemPOJO = structuredClone(projectItemPOJO)

      newProjectItemPOJO.databaseId = 984379821739
      existingProjectItemPOJO.project.owner.login = 'T~{dZqN%M~i=0<KAwa'

      const existingPagePOJO = {
        edges: [
          {
            node: deletedProjectItemPOJO
          },
          {
            node: existingProjectItemPOJO
          }
        ],
        pageInfo: {
          endCursor: 'AB',
          hasNextPage: true
        }
      }

      const newPagePojo = structuredClone(existingPagePOJO)

      newPagePojo.edges[1].node.fieldValues.edges.push({
        node: {
          name: existingProjectItemUpdatedFieldValueName
        }
      })

      newPagePojo.edges.push({
        node: newProjectItemPOJO
      })
      newPagePojo.pageInfo.endCursor = 'XY'
      newPagePojo.pageInfo.hasNextPage = false

      page = new GraphQLPageMergeable<ProjectItem>(existingPagePOJO, ProjectItem)
      page.delete(0)

      pageToBeMerged = new GraphQLPageMergeable<ProjectItem>(newPagePojo, ProjectItem)
    })

    it('adds all the records from the page passed as an argument not found in the page to be merged into', () => {
      const newProjectItemId = newProjectItemPOJO.databaseId

      expect(page.getNodeArray().find((projectItem) => {
        return projectItem.getId() === newProjectItemId
      })).toBe(undefined)

      page.merge(pageToBeMerged)

      expect(page.getNodeArray().find((projectItem) => {
        return projectItem.getId() === newProjectItemId
      })).not.toBe(undefined)
    })

    it('does not re-add deleted nodes', () => {
      const deletedId = projectItemPOJO.databaseId

      expect(page.deletedNodeIds.has(deletedId)).toBe(true)

      page.merge(pageToBeMerged)

      expect(page.getNodeArray().find((projectItem) => {
        return projectItem.getId() === deletedId
      })).toBe(undefined)
    })

    it('overwrites records found in both pages using records from the page passed as an argument', () => {
      const existingProjectItemId = existingProjectItemPOJO.databaseId
      const existingProjectItem = page.getNodeArray().find((projectItem) => {
        return projectItem.id === existingProjectItemId
      })

      expect(existingProjectItem).not.toBe(undefined)
      expect(existingProjectItem?.fieldValues.getNodeArray().length).toBe(0)

      page.merge(pageToBeMerged)

      expect(page.getNodeArray().find((projectItem) => {
        return projectItem.getId() === existingProjectItemId && projectItem.fieldValues.getNodeArray().find((fieldValue) => {
          return fieldValue.name === existingProjectItemUpdatedFieldValueName
        })
      })).not.toBe(undefined)
    })

    it('overwrites the pageInfo of the page with the pageInfo of the passed page', () => {
      const oldPageInfo = page.getPageInfo()

      page.merge(pageToBeMerged)

      expect(page.getPageInfo()).not.toEqual(oldPageInfo)
    })
  })
})

describe('The Issue class', () => {
  beforeEach(() => { // The Issue constructor mutates the projectItemPOJO sub-object. This avoids the mutation persisting through to other tests
    projectItemPagePOJO.edges[0].node = structuredClone(projectItemPOJO)
  })

  afterEach(() => {
    projectItemPagePOJO.edges[0].node = projectItemPOJO
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
          number: 'wrong type for number',
          labels: [],
          projectItems: projectItemPagePOJO
        })
      }).toThrow(TypeError)
    })

    it('throws an error when passed an issue object with an invalid project item page', () => {
      expect(() => {
        new Issue({
          number: 1,
          labels: labelPagePOJO,
          projectItems: {
            pageInfo: null
          }
        })
      }).toThrow(ReferenceError)
    })

    it('successfully constructs the Issue when passed a valid object', () => {
      expect(() => {
        const issuePOJOCopy: any = structuredClone(issuePOJO)

        new Issue(issuePOJOCopy)
      }).not.toThrow()
    })

    it('successfully constructs the Issue when passed an issue object with an invalid label page', () => {
      expect(() => {
        new Issue({
          number: 1,
          labels: {
            pageInfo: null
          },
          projectItems: projectItemPagePOJO
        })
      }).not.toThrow()
    })

    it('successfully constructs the Issue when passed an issue object without a label page', () => {
      expect(() => {
        new Issue({
          number: 1,
          projectItems: projectItemPagePOJO
        })
      }).not.toThrow()
    })
  })

  describe('findColumnName()', () => {
    describe('when the search space does not contain column names', () => {
      describe('when the search space is complete', () => {
        it('returns null when the column name could not be found', () => {
          const issuePOJOCopy = structuredClone(issuePOJO)

          issuePOJOCopy.projectItems.edges[0].node.fieldValues.edges = []
          issuePOJOCopy.projectItems.edges[0].node.fieldValues.pageInfo.hasNextPage = false

          const issue = new Issue(issuePOJOCopy)

          expect(issue.findColumnName()).toBe(null)
        })
      })

      describe('when the search space is incomplete', () => {
        describe('when projects are enabled', () => {
          it('returns an issue as the remote query parameters when the extended column name search space has not yet been applied to the issue', () => {
            const issuePOJOCopy = structuredClone(issuePOJO)

            issuePOJOCopy.projectItems.pageInfo.hasNextPage = true
            issuePOJOCopy.projectItems.edges[0].node.fieldValues.edges = []

            const issue = new Issue(issuePOJOCopy, true)
            const project = issuePOJO.projectItems.edges[0].node.project
            const columnNameSearchResult = issue.findColumnName(project.owner.login, project.number)

            expect(Array.isArray(columnNameSearchResult)).toBe(true)

            expect((columnNameSearchResult as Array<RemoteRecordPageQueryParameters>).find((queryParameters) => {
              return queryParameters.recordContainer instanceof Issue
            })).not.toBe(undefined)
          })

          it('returns a set of remote query parameters including each incomplete page in the search space when the extended column name search space has been applied to the issue', () => {
            const issuePOJOCopy = structuredClone(issuePOJO)

            issuePOJOCopy.projectItems.pageInfo.hasNextPage = true
            issuePOJOCopy.projectItems.edges[0].node.fieldValues.edges = []

            const issue = new Issue(issuePOJOCopy, true)
            issue.hasExtendedSearchSpace = true

            const project = issuePOJO.projectItems.edges[0].node.project
            const columnNameSearchResult = issue.findColumnName(project.owner.login, project.number)

            expect(Array.isArray(columnNameSearchResult)).toBe(true)

            expect((columnNameSearchResult as Array<RemoteRecordPageQueryParameters>).find((queryParameters) => {
              return queryParameters.parentId === projectItemPOJO.databaseId &&
                queryParameters.recordContainer instanceof GraphQLPage &&
                queryParameters.recordContainer.lookupNodeClass() === FieldValue
            })).not.toBe(undefined)

            expect((columnNameSearchResult as Array<RemoteRecordPageQueryParameters>).find((queryParameters) => {
              return queryParameters.parentId === issuePOJO.number &&
                queryParameters.recordContainer instanceof GraphQLPage &&
                queryParameters.recordContainer.lookupNodeClass() === ProjectItem
            })).not.toBe(undefined)
          })
        })
      })
    })

    describe('when the search space contains column names', () => {
      let issuePOJOCopy: any

      beforeEach(() => {
        issuePOJOCopy = structuredClone(issuePOJO)

        const extraProjectItem1 = {
          "databaseId": 65248238,
          "fieldValues": {
            "edges": [],
            "pageInfo": {
              "endCursor": "MQ",
              "hasNextPage": true
            }
          },
          "project": {
            "number": 1,
            "owner": {
              "login": "29;UhhP@%nooLB#ms"
            }
          }
        }

        const extraProjectItem2 = {
          "databaseId": 65248240,
          "fieldValues": {
            "edges": [
              {
                node: {
                  name: 'e?+aYAe8>^X6|xaM='
                }
              }
            ],
            "pageInfo": {
              "endCursor": "MQ",
              "hasNextPage": true
            }
          },
          "project": {
            "number": 2,
            "owner": {
              "login": "non matching project"
            }
          }
        }

        issuePOJOCopy.projectItems.edges.unshift({ node: extraProjectItem1 })
        issuePOJOCopy.projectItems.edges.push({ node: extraProjectItem2 })
      })

      describe('when projects are not enabled', () => {
        it('returns the column name', () => {
          const issue = new Issue(issuePOJOCopy)

          expect(TypeChecker.isString(issue.findColumnName())).toBe(true)
        })
      })

      describe('when projects are enabled', () => {
        it('does not return a column name if the project item does not match the passed project number', () => {
          const issue = new Issue(issuePOJOCopy, true)

          expect(issue.findColumnName(projectPOJO.owner.login, 100)).not.toBe(fieldValuePOJO.name)
        })

        it('does not return a column name if the project item does not match the passed project owner name', () => {
          const issue = new Issue(issuePOJOCopy, true)

          expect(issue.findColumnName('Non matching name', projectPOJO.number)).not.toBe(fieldValuePOJO.name)
        })

        it('returns a column name if the project owner and number match the project filtering parameters', () => {
          const issue = new Issue(issuePOJOCopy, true)

          expect(issue.findColumnName(projectPOJO.owner.login, projectPOJO.number)).toBe(fieldValuePOJO.name)
        })
      })
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
      const issuePOJOCopy: any = structuredClone(issuePOJO)

      const issue = new Issue(issuePOJOCopy)

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
      projectItemPOJOCopy.fieldValues.edges.splice(0, 1)

      const projectItem = new ProjectItem(projectItemPOJOCopy)

      expect(projectItem.findColumnName()).toBe(null)
    })

    it('returns an object containing parameters to fetch more data on a fail', () => {
      const projectItemPOJOCopy = structuredClone(projectItemPOJO)

      projectItemPOJOCopy.fieldValues.edges.splice(0, 1)

      const projectItem = new ProjectItem(projectItemPOJOCopy)

      expect(projectItem.findColumnName()).toEqual({
        parentId: projectItemPOJO.databaseId,
        recordContainer: projectItem.fieldValues
      })
    })

    it('returns the column name on a successful search', () => {
      const projectItemPOJOCopy = structuredClone(projectItemPOJO)

      projectItemPOJOCopy.fieldValues.pageInfo.hasNextPage = false

      const projectItem = new ProjectItem(projectItemPOJOCopy)

      expect(projectItem.findColumnName()).toBe(fieldValuePOJO.name)
    })
  })

  describe('getProjectHumanAccessibleUniqueIdentifiers()', () => {
    it('returns the name of the ProjectItem\'s parent project', () => {
      const projectItem = new ProjectItem(structuredClone(projectItemPOJO))

      expect(projectItem.getProjectHumanAccessibleUniqueIdentifiers()).toEqual({
        number: projectItemPOJO.project.number,
        ownerLoginName: projectItemPOJO.project.owner.login
      })
    })
  })
})

describe('The RecordWithID class', () => {
  describe('getId', () => {
    it('returns the id of the record', () => {
      const numericId = 40372098174
      const stringId = '?1>Yd]i|IZfLJI?HGg'

      const numericIdRecord = new RecordWithID(numericId)
      const stringIdRecord = new RecordWithID(stringId)

      expect(numericIdRecord.getId()).toBe(numericId)
      expect(stringIdRecord.getId()).toBe(stringId)
    })
  })
})

describe('initializeNodes()', () => {
  it('converts all valid nodes to instances of the class parameter', () => {
    const fieldValuePagePOJOCopy = structuredClone(fieldValuePagePOJO)
    const fieldValuePOJO2 = {
      name: '+=Xh(TZCqK}e\@]O1s[@'
    }

    fieldValuePagePOJOCopy.edges.push({
      node: fieldValuePOJO2
    })

    const graphQLPage = new GraphQLPage(fieldValuePagePOJOCopy)

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
    const fieldValuePagePOJOCopy = structuredClone(fieldValuePagePOJO)
    const fieldValuePOJOInvalid: any = {
      columnName: '+=Xh(TZCqK}e\@]O1s[@'
    }

    fieldValuePagePOJOCopy.edges.push({
      node: fieldValuePOJOInvalid
    })

    const graphQLPage = new GraphQLPage(fieldValuePagePOJOCopy, FieldValue)

    const instantiatedNodes = graphQLPage.getNodeArray()

    expect(instantiatedNodes.find((node) => {
      return node instanceof FieldValue && node.getName() === fieldValuePOJO.name
    })).not.toBe(undefined)

    expect(instantiatedNodes.find((node) => {
      return node instanceof FieldValue && node.getName() === fieldValuePOJOInvalid.name
    })).toBe(undefined)

    expect(instantiatedNodes.length).toBe(1)
  })

  it('passes the third argument onwards to the constructor of the class passed', () => {
    const extraArg1 = 'extra argument'
    const extraArg2 = ['extra argument 2']
    const fieldValuePagePOJOCopy = structuredClone(fieldValuePagePOJO)
    const testClassJSONArg = fieldValuePagePOJOCopy.edges[0].node
    const TestClass = require('./testClass')

    initializeNodes(TestClass, new GraphQLPage<typeof TestClass>(fieldValuePagePOJOCopy), extraArg1, extraArg2)

    jest.mock('./testClass')

    expect(TestClass).toHaveBeenCalledWith(testClassJSONArg, extraArg1, extraArg2)
  })
})
