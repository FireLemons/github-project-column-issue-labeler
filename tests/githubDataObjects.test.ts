import { FieldValue, GraphQLPage, GraphQLPageMergeable, Issue, Label, ProjectItem, RecordWithID, RemoteRecordPageQueryParameters, initializeNodes } from '../src/githubObjects'
import GithubObjectsTestData from './githubObjectsTestData'
import * as TypeChecker from '../src/typeChecker'

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
        new FieldValue(GithubObjectsTestData.getFieldValuePOJO())
      }).not.toThrow()
    })
  })

  describe('getName()', () => {
    it('returns the name of the FieldValue instance', () => {
      const fieldValuePOJO = GithubObjectsTestData.getFieldValuePOJO()
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
      expect(() => {
        new GraphQLPage<Issue>(GithubObjectsTestData.getInvalidIssuePagePOJO())
      }).toThrow(TypeError)
    })

    it('does not throw an error when passed a page', () => {
      expect(() => {
        new GraphQLPage(GithubObjectsTestData.getPagePOJOMinimal())
      }).not.toThrow(TypeError)
    })

    it('can toggle issue paged between project and non project mode', () => {
      const issuePagePOJO = GithubObjectsTestData.getIssuePagePOJO()
      const issuePageProjectsDisabled = new GraphQLPage<Issue>(issuePagePOJO, Issue, false)
      const issuesWithProjectsDisabled = issuePageProjectsDisabled.getNodeArray()
      expect(issuesWithProjectsDisabled.length).not.toBe(0)
      expect(issuesWithProjectsDisabled[0].columnNameMap).not.toBe(undefined)
      expect(issuesWithProjectsDisabled[0].columnName).toBe(undefined)

      const issuePagePOJO2 = GithubObjectsTestData.getIssuePagePOJO()
      const issuePageProjectsEnabled = new GraphQLPage<Issue>(issuePagePOJO2, Issue, true)
      const issuesWithProjectsEnabled = issuePageProjectsEnabled.getNodeArray()
      expect(issuesWithProjectsEnabled.length).not.toBe(0)
      expect(issuesWithProjectsEnabled[0].columnNameMap).not.toBe(undefined)
      expect(issuesWithProjectsEnabled[0].columnName).toBe(undefined)
    })
  })

  describe('appendPage()', () => {
    let appendedPageFieldValueName: string
    let originalPageFieldValueName: string
    let appendedPageEndCursor: string
    let appendedPageHasNextPage: boolean
    let combinedPage: GraphQLPage<FieldValue>

    beforeAll(() => {
      const fieldValuePagePOJO = GithubObjectsTestData.getFieldValuePagePOJO()
      const fieldValuePagePOJOAppended = GithubObjectsTestData.getDifferentValuePagePOJO()

      originalPageFieldValueName = fieldValuePagePOJO.edges[0].node.name
      appendedPageFieldValueName = fieldValuePagePOJOAppended.edges[0].node.name
      appendedPageEndCursor = fieldValuePagePOJOAppended.pageInfo.endCursor
      appendedPageHasNextPage = fieldValuePagePOJOAppended.pageInfo.hasNextPage

      combinedPage = new GraphQLPage<FieldValue>(fieldValuePagePOJO)
      const pageToBeAppended = new GraphQLPage<FieldValue>(GithubObjectsTestData.getDifferentValuePagePOJO())

      combinedPage.appendPage(pageToBeAppended)
    })

    it('appends the edges from the page passed as an argument to the page', () => {
      expect(combinedPage.getEdges().find((edge) => {
        return edge.node.name === originalPageFieldValueName
      })).not.toBe(undefined)

      expect(combinedPage.getEdges().find((edge) => {
        return edge.node.name === appendedPageFieldValueName
      })).not.toBe(undefined)
    })

    it('updates the pageInfo for the page with the pageInfo from the passed page', () => {
      const combinedPagePageInfo = combinedPage.getPageInfo()

      expect(combinedPagePageInfo.endCursor).toBe(appendedPageEndCursor)
      expect(combinedPagePageInfo.hasNextPage).toBe(appendedPageHasNextPage)
    })
  })

  describe('delete()', () => {
    it('removes the edge at the index passed from the graphQL page', () => {
      const fieldValuePagePOJO = GithubObjectsTestData.getFieldValuePagePOJOWithMultipleFieldValues()
      const fieldValueName1 = fieldValuePagePOJO.edges[0].node.name
      const fieldValueName2 = fieldValuePagePOJO.edges[1].node.name
      const page = new GraphQLPage<FieldValue>(fieldValuePagePOJO, FieldValue)

      page.delete(1)

      const nodes = page.getNodeArray()

      expect(nodes.find((fieldValue) => {
        return fieldValue.name === fieldValueName1
      })).not.toBe(undefined)

      expect(nodes.find((fieldValue) => {
        return fieldValue.name === fieldValueName2
      })).toBe(undefined)

      page.delete(0)

      expect(page.isEmpty()).toBe(true)
    })

    it('returns the removed node', () => {
      const fieldValuePagePOJO = GithubObjectsTestData.getFieldValuePagePOJO()
      const onlyFieldValueName = fieldValuePagePOJO.edges[0].node.name
      const page = new GraphQLPage<FieldValue>(fieldValuePagePOJO, FieldValue)

      expect(page.delete(0).getName()).toBe(onlyFieldValueName)
    })

    it('throws an error when the index is out of bounds', () => {
      const page = new GraphQLPage<FieldValue>(GithubObjectsTestData.getFieldValuePagePOJO(), FieldValue)

      expect(() => {
        page.delete(1)
      }).toThrow(RangeError)
    })
  })

  describe('getEdges()', () => {
    it('returns the edges of the graphQL page', () => {
      const labelPagePOJO = GithubObjectsTestData.getLabelPagePOJO()
      const page = new GraphQLPage(labelPagePOJO)

      expect(page.getEdges()).toBe(labelPagePOJO.edges)
    })
  })

  describe('getEndCursor()', () => {
    it('returns the end cursor of the graphQL page', () => {
      const labelPagePOJO = GithubObjectsTestData.getLabelPagePOJO()
      const page = new GraphQLPage(labelPagePOJO)

      expect(page.getEndCursor()).toBe(labelPagePOJO.pageInfo.endCursor)
    })
  })

  describe('getNodeArray()', () => {
    it('returns the nodes of the graphQL page as an array', () => {
      const fieldValuePagePOJO = GithubObjectsTestData.getFieldValuePagePOJO()
      const fieldValuePageOnlyNode = fieldValuePagePOJO.edges[0].node
      const page = new GraphQLPage(fieldValuePagePOJO)

      expect(page.getNodeArray()).toEqual([
        fieldValuePageOnlyNode
      ])
    })
  })

  describe('getPageInfo()', () => {
    it('returns the page info of the graphQL page', () => {
      const labelPagePOJO = GithubObjectsTestData.getLabelPagePOJO()
      const page = new GraphQLPage(labelPagePOJO)

      expect(page.getPageInfo()).toBe(labelPagePOJO.pageInfo)
    })
  })

  describe('isEmpty()', () => {
    it('returns true if the page does not have nodes', () => {
      const labelPage = new GraphQLPage(GithubObjectsTestData.getEmptyLabelPagePOJO())

      expect(labelPage.isEmpty()).toBeTruthy()
    })

    it('returns false if the page has nodes', () => {
      const labelPage = new GraphQLPage(GithubObjectsTestData.getLabelPagePOJO())

      expect(labelPage.isEmpty()).toBeFalsy()
    })
  })

  describe('isLastPage()', () => {
    it('returns true if the pageInfo indicates the page is the last page', () => {
      const labelPage = new GraphQLPage(GithubObjectsTestData.getCompleteLabelPagePOJO())

      expect(labelPage.isLastPage()).toBeTruthy()
    })

    it('returns false if the pageInfo indicates the page is not the last page', () => {
      const labelPage = new GraphQLPage(GithubObjectsTestData.getLabelPagePOJO())

      expect(labelPage.isLastPage()).toBeFalsy()
    })
  })
})

describe('The GraphQLPageMergeable class', () => {
  describe('delete()', () => {
    it('removes the edge at the index passed from the graphQL page', () => {
      const projectItemPagePOJO = GithubObjectsTestData.getMergeableProjectItemPagePOJO()
      const firstProjectItemId = projectItemPagePOJO.edges[0].node.databaseId
      const secondProjectItemId = projectItemPagePOJO.edges[1].node.databaseId

      const page = new GraphQLPageMergeable<ProjectItem>(projectItemPagePOJO, ProjectItem)

      page.delete(1)

      const nodes = page.getNodeArray()

      expect(nodes.find((projectItem) => {
        return projectItem.getId() === firstProjectItemId
      })).not.toBe(undefined)

      expect(nodes.find((projectItem) => {
        return projectItem.getId() === secondProjectItemId
      })).toBe(undefined)

      page.delete(0)

      expect(page.isEmpty()).toBe(true)
    })

    it('returns the removed node', () => {
      const pagePOJO = GithubObjectsTestData.getMergeableProjectItemPagePOJO()
      const firstRecordId = pagePOJO.edges[0].node.databaseId
      const page = new GraphQLPageMergeable<ProjectItem>(pagePOJO, ProjectItem)

      expect(page.delete(0).getId()).toBe(firstRecordId)
    })

    it('stores the id of deleted nodes', () => {
      const pagePOJO = GithubObjectsTestData.getMergeableProjectItemPagePOJO()
      const firstRecordId = pagePOJO.edges[0].node.databaseId
      const page = new GraphQLPageMergeable<ProjectItem>(pagePOJO, ProjectItem)

      expect(page.deletedNodeIds.has(firstRecordId)).toBe(false)

      page.delete(0)

      expect(page.deletedNodeIds.has(firstRecordId)).toBe(true)
    })
  })

  describe('merge()', () => {
    const projectItemPOJO = GithubObjectsTestData.getProjectItemPOJO()
    let deletedProjectItemPOJO: typeof projectItemPOJO
    let existingProjectItemPOJO: typeof projectItemPOJO
    let existingProjectItemPOJOUpdated: typeof projectItemPOJO
    let newProjectItemPOJO: typeof projectItemPOJO
    let page: GraphQLPageMergeable<ProjectItem>
    let pageToBeMerged: GraphQLPageMergeable<ProjectItem>

    beforeEach(() => {
      const existingPagePOJO = GithubObjectsTestData.getMergeableProjectItemPagePOJO()
      const newPagePOJO = GithubObjectsTestData.getProjectItemPagePOJOToBeMerged()
  
      deletedProjectItemPOJO = existingPagePOJO.edges[0].node
      existingProjectItemPOJO = existingPagePOJO.edges[1].node
      existingProjectItemPOJOUpdated = newPagePOJO.edges[1].node
      newProjectItemPOJO = newPagePOJO.edges[2].node

      page = new GraphQLPageMergeable<ProjectItem>(existingPagePOJO, ProjectItem)
      page.delete(0)

      pageToBeMerged = new GraphQLPageMergeable<ProjectItem>(newPagePOJO, ProjectItem)
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
      const deletedId = deletedProjectItemPOJO.databaseId

      expect(page.deletedNodeIds.has(deletedId)).toBe(true)

      page.merge(pageToBeMerged)

      expect(page.getNodeArray().find((projectItem) => {
        return projectItem.getId() === deletedId
      })).toBe(undefined)
    })

    it('overwrites records found in both pages using records from the page passed as an argument', () => {
      const existingProjectItemId = existingProjectItemPOJO.databaseId
      const existingProjectItemUpdatedFieldValueName = existingProjectItemPOJOUpdated.fieldValues.edges[0].node.name
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
  describe('constructor', () => {
    it('throws an error when passed a non object value', () => {
      expect(() => {
        new Issue(2)
      }).toThrow(TypeError)
    })

    it('throws an error when passed an object not matching an issue', () => {
      expect(() => {
        new Issue(GithubObjectsTestData.getIssuePOJOWithInvalidValueTypes())
      }).toThrow(TypeError)
    })

    it('throws an error when passed an issue object with an invalid project item page', () => {
      expect(() => {
        new Issue(GithubObjectsTestData.getIssuePOJOWithInvalidProjectItemPage())
      }).toThrow(ReferenceError)
    })

    it('successfully constructs the Issue when passed a valid object', () => {
      expect(() => {
        new Issue(GithubObjectsTestData.getIssuePOJO())
      }).not.toThrow()
    })

    it('successfully constructs the Issue when passed an issue object with an invalid label page', () => {
      expect(() => {
        new Issue(GithubObjectsTestData.getIssuePOJOWithInvalidLabelPage())
      }).not.toThrow()
    })

    it('successfully constructs the Issue when passed an issue object without a label page', () => {
      expect(() => {
        new Issue(GithubObjectsTestData.getIssuePOJOWithoutLabels())
      }).not.toThrow()
    })
  })

  describe('findColumnName()', () => {
    describe('when the search space does not contain column names', () => {
      describe('when the search space is complete', () => {
        it('returns null when the column name could not be found', () => {
          const issue = new Issue(GithubObjectsTestData.getIssuePOJOWithoutColumnNames())

          expect(issue.findColumnName()).toBe(null)
        })
      })

      describe('when the search space is incomplete', () => {
        describe('when projects are enabled', () => {
          it('returns an issue as the remote query parameters when the extended column name search space has not yet been applied to the issue', () => {
            const issuePOJO = GithubObjectsTestData.getIssuePOJOWithoutColumnNamesAndIncompleteLocalSearchSpace()
            const issue = new Issue(issuePOJO, true)
            const projectIdenifiers = issue.projectItems.getNodeArray()[0].getProjectHumanAccessibleUniqueIdentifiers()
            const columnNameSearchResult = issue.findColumnName(projectIdenifiers.ownerLoginName, projectIdenifiers.number)

            expect(Array.isArray(columnNameSearchResult)).toBe(true)

            expect((columnNameSearchResult as Array<RemoteRecordPageQueryParameters>).find((queryParameters) => {
              return queryParameters.recordContainer instanceof Issue
            })).not.toBe(undefined)
          })

          it('returns a set of remote query parameters including each incomplete page in the search space when the extended column name search space has been applied to the issue', () => {
            const issuePOJO = GithubObjectsTestData.getIssuePOJOWithoutColumnNamesAndIncompleteLocalSearchSpace()
            const project = issuePOJO.projectItems.edges[0].node.project
            const projectItemId = issuePOJO.projectItems.edges[0].node.databaseId
            const issue = new Issue(issuePOJO, true)

            issue.hasExtendedSearchSpace = true

            const columnNameSearchResult = issue.findColumnName(project.owner.login, project.number)

            expect(Array.isArray(columnNameSearchResult)).toBe(true)

            expect((columnNameSearchResult as Array<RemoteRecordPageQueryParameters>).find((queryParameters) => {
              return queryParameters.parentId === projectItemId &&
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
      let issuePOJO: any

      beforeEach(() => {
        issuePOJO = GithubObjectsTestData.getIssuePOJOWithManyProjectItems()
      })

      describe('when projects are not enabled', () => {
        it('returns the column name', () => {
          const issue = new Issue(issuePOJO)

          expect(TypeChecker.isString(issue.findColumnName())).toBe(true)
        })
      })

      describe('when projects are enabled', () => {
        it('does not return a column name if the project item does not match the passed project number', () => {
          const projectOwnerName = issuePOJO.projectItems.edges[0].node.project.owner.login
          const nonMatchingColumnName = issuePOJO.projectItems.edges[1].node.fieldValues.edges[0].node.name
          const issue = new Issue(issuePOJO, true)

          expect(issue.findColumnName(projectOwnerName, 100)).not.toBe(nonMatchingColumnName)
        })

        it('does not return a column name if the project item does not match the passed project owner name', () => {
          const projectNumber = issuePOJO.projectItems.edges[0].node.project.number
          const nonMatchingColumnName = issuePOJO.projectItems.edges[1].node.fieldValues.edges[0].node.name
          const issue = new Issue(issuePOJO, true)

          expect(issue.findColumnName('Non matching name', projectNumber)).not.toBe(nonMatchingColumnName)
        })

        it('returns a column name if the project owner and number match the project filtering parameters', () => {
          const projectNumber = issuePOJO.projectItems.edges[0].node.project.number
          const projectOwnerName = issuePOJO.projectItems.edges[0].node.project.owner.login
          const columnName = issuePOJO.projectItems.edges[1].node.fieldValues.edges[0].node.name
          const issue = new Issue(issuePOJO, true)

          expect(issue.findColumnName(projectOwnerName, projectNumber)).toBe(columnName)
        })
      })
    })
  })

  describe('getLabels()', () => {
    it('returns the labels of the Issue instance as an array', () => {
      const issue = new Issue(GithubObjectsTestData.getIssuePOJOWithManyLabels())

      expect(issue.getLabels()).toEqual(expect.arrayContaining(['jC8?&U0V`Cch4)II/10#', 'lA0$,&jb.>d<Hi3{*[B', '5~hg?<[kjHwGhUII-p:']))
    })

    it('returns null when the label page cannot be initialized', () => {
      const issue = new Issue(GithubObjectsTestData.getIssuePOJOWithInvalidLabelPage())

      expect(issue.getLabels()).toBe(null)
    })
  })

  describe('getNumber()', () => {
    it('returns the number of the Issue instance', () => {
      const issuePOJO = GithubObjectsTestData.getIssuePOJO()
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
        new Label(GithubObjectsTestData.getLabelPOJO())
      }).not.toThrow()
    })
  })

  describe('getName()', () => {
    it('returns the name of the Label instance', () => {
      const labelPOJO = GithubObjectsTestData.getLabelPOJO()
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
      expect(() => {
        new ProjectItem(GithubObjectsTestData.getProjectItemPOJOWithInvalidFieldValuePage())
      }).toThrow(ReferenceError)
    })

    it('successfully constructs the ProjectItem when passed a valid object', () => {
      expect(() => {
        new ProjectItem(structuredClone(GithubObjectsTestData.getProjectItemPOJO()))
      }).not.toThrow()
    })
  })

  describe('findColumnName()', () => {
    it('returns null if the column name could not be found with complete pages', () => {
      const projectItemPOJO = GithubObjectsTestData.getProjectItemPOJOWithoutColumnName()
      const projectItem = new ProjectItem(projectItemPOJO)

      expect(projectItem.findColumnName()).toBe(null)
    })

    it('returns an object containing parameters to fetch more data on a fail', () => {
      const projectItemPOJO = GithubObjectsTestData.getProjectItemPOJOWithoutLocalColumnName()
      const projectItemId = projectItemPOJO.databaseId
      const projectItem = new ProjectItem(projectItemPOJO)

      expect(projectItem.findColumnName()).toEqual({
        parentId: projectItemId,
        recordContainer: projectItem.fieldValues
      })
    })

    it('returns the column name on a successful search', () => {
      const projectItemPOJOCopy = GithubObjectsTestData.getProjectItemPOJO()
      const projectName = projectItemPOJOCopy.fieldValues.edges[0].node.name
      const projectItem = new ProjectItem(projectItemPOJOCopy)

      expect(projectItem.findColumnName()).toBe(projectName)
    })
  })

  describe('getProjectHumanAccessibleUniqueIdentifiers()', () => {
    it('returns the name of the ProjectItem\'s parent project', () => {
      const projectItemPOJO = GithubObjectsTestData.getProjectItemPOJO()
      const projectItem = new ProjectItem(projectItemPOJO)

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
    const pagePOJO = GithubObjectsTestData.getPagePOJOWithMultipleNodes()
    const fieldValueName1 = pagePOJO.edges[0].node.name
    const fieldValueName2 = pagePOJO.edges[1].node.name

    const graphQLPage = new GraphQLPage(pagePOJO, FieldValue)

    const instantiatedNodes = graphQLPage.getNodeArray()

    expect(instantiatedNodes.find((node) => {
      return node instanceof FieldValue && node.getName() === fieldValueName1
    })).not.toBe(undefined)

    expect(instantiatedNodes.find((node) => {
      return node instanceof FieldValue && node.getName() === fieldValueName2
    })).not.toBe(undefined)
  })

  it('discards edges containing nodes that could not be instantiated', () => {
    const pagePOJOWithInvalidNode = GithubObjectsTestData.getPagePOJOWithInvalidNode()
    const validNodeFieldValue = pagePOJOWithInvalidNode.edges[0].node.name
    const invalidNodeValue = pagePOJOWithInvalidNode.edges[1].node.wrongKey

    const graphQLPage = new GraphQLPage(pagePOJOWithInvalidNode, FieldValue)

    const instantiatedNodes = graphQLPage.getNodeArray()

    expect(instantiatedNodes.find((node) => {
      return node instanceof FieldValue && node.getName() === validNodeFieldValue
    })).not.toBe(undefined)

    expect(instantiatedNodes.find((node) => {
      return node instanceof FieldValue && node.getName() === invalidNodeValue
    })).toBe(undefined)

    expect(instantiatedNodes.length).toBe(1)
  })

  it('passes the third argument onwards to the constructor of the class passed', () => {
    const extraArg1 = 'extra argument'
    const extraArg2 = ['extra argument 2']
    const pagePOJO = GithubObjectsTestData.getPagePOJOMinimal()
    const testClassJSONArg = pagePOJO.edges[0].node
    const TestClass = require('./testClass')

    initializeNodes(TestClass, new GraphQLPage<typeof TestClass>(pagePOJO), extraArg1, extraArg2)

    jest.mock('./testClass')

    expect(TestClass).toHaveBeenCalledWith(testClassJSONArg, extraArg1, extraArg2)
  })
})
