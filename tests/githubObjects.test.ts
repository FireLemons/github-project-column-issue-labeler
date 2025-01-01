import { FieldValue, GraphQLPage, GraphQLPageMergeable, Issue, Label, ProjectItem, ProjectPrimaryKeyHumanReadable, RecordWithGraphQLID } from '../src/githubObjects'
import GithubObjectsTestData from './data/githubObjectsTestData'

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
  })

  describe('appendPage()', () => {
    let appendedPageFieldValueName: string
    let originalPageFieldValueName: string
    let appendedPageEndCursor: string
    let appendedPageHasNextPage: boolean
    let combinedPage: GraphQLPage<FieldValue>

    beforeAll(() => {
      const fieldValuePagePOJO = GithubObjectsTestData.getFieldValuePagePOJO()
      const fieldValuePagePOJOAppended = GithubObjectsTestData.getLastFieldValuePagePOJO()

      originalPageFieldValueName = fieldValuePagePOJO.edges[0].node.name
      appendedPageFieldValueName = fieldValuePagePOJOAppended.edges[0].node.name
      appendedPageEndCursor = fieldValuePagePOJOAppended.pageInfo.endCursor
      appendedPageHasNextPage = fieldValuePagePOJOAppended.pageInfo.hasNextPage

      combinedPage = new GraphQLPage<FieldValue>(fieldValuePagePOJO)
      const pageToBeAppended = new GraphQLPage<FieldValue>(fieldValuePagePOJOAppended)

      combinedPage.appendPage(pageToBeAppended)
    })

    it('appends the edges from the page passed in', () => {
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

  describe('disableRemoteDataFetching()', () => {
    it('marks the GraphQLPage as not having any more pages to fetch', () => {
      const page = new GraphQLPage<FieldValue>(GithubObjectsTestData.getFieldValuePagePOJO(), FieldValue)

      expect(page.hasNextPage()).toBe(true)

      page.disableRemoteDataFetching()

      expect(page.hasNextPage()).toBe(false)
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
      const labelPage = new GraphQLPage(GithubObjectsTestData.getEmptyPagePOJO())

      expect(labelPage.isEmpty()).toBeTruthy()
    })

    it('returns false if the page has nodes', () => {
      const labelPage = new GraphQLPage(GithubObjectsTestData.getLabelPagePOJO())

      expect(labelPage.isEmpty()).toBeFalsy()
    })
  })

  describe('hasNextPage()', () => {
    it('returns true if the pageInfo indicates the are more pages to fetch', () => {
      const labelPage = new GraphQLPage(GithubObjectsTestData.getLabelPagePOJO())

      expect(labelPage.hasNextPage()).toBe(true)
    })

    it('returns false if the pageInfo indicates there are no more pages to fetch', () => {
      const labelPage = new GraphQLPage(GithubObjectsTestData.getCompleteLabelPagePOJO())

      expect(labelPage.hasNextPage()).toBe(false)
    })
  })
})

describe('The GraphQLPageMergeable class', () => {
  describe('constructor', () => {

  })

  describe('delete()', () => {
    it('removes the edge at the index passed from the graphQL page', () => {
      const projectItemPagePOJO = GithubObjectsTestData.getMergeableProjectItemPagePOJO()
      const firstProjectItemId = projectItemPagePOJO.edges[0].node.id
      const secondProjectItemId = projectItemPagePOJO.edges[1].node.id

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
      const firstRecordId = pagePOJO.edges[0].node.id
      const page = new GraphQLPageMergeable<ProjectItem>(pagePOJO, ProjectItem)

      expect(page.delete(0).getId()).toBe(firstRecordId)
    })

    it('stores the id of deleted nodes', () => {
      const pagePOJO = GithubObjectsTestData.getMergeableProjectItemPagePOJO()
      const firstRecordId = pagePOJO.edges[0].node.id
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
      const newProjectItemId = newProjectItemPOJO.id

      expect(page.getNodeArray().find((projectItem) => {
        return projectItem.getId() === newProjectItemId
      })).toBe(undefined)

      page.merge(pageToBeMerged)

      expect(page.getNodeArray().find((projectItem) => {
        return projectItem.getId() === newProjectItemId
      })).not.toBe(undefined)
    })

    it('does not re-add deleted nodes', () => {
      const deletedId = deletedProjectItemPOJO.id

      expect(page.deletedNodeIds.has(deletedId)).toBe(true)

      page.merge(pageToBeMerged)

      expect(page.getNodeArray().find((projectItem) => {
        return projectItem.getId() === deletedId
      })).toBe(undefined)
    })

    it('overwrites records found in both pages using records from the page passed as an argument', () => {
      const existingProjectItemId = existingProjectItemPOJO.id
      const existingProjectItemUpdatedFieldValueName = existingProjectItemPOJOUpdated.fieldValues.edges[0].node.name
      const existingProjectItem = page.getNodeArray().find((projectItem) => {
        return projectItem.getId() === existingProjectItemId
      })

      expect(existingProjectItem).not.toBe(undefined)
      expect(existingProjectItem?.getFieldValuePage().getNodeArray().length).toBe(0)

      page.merge(pageToBeMerged)

      expect(page.getNodeArray().find((projectItem) => {
        return projectItem.getId() === existingProjectItemId && projectItem.getFieldValuePage().getNodeArray().find((fieldValue) => {
          return fieldValue.name === existingProjectItemUpdatedFieldValueName
        })
      })).not.toBe(undefined)
    })

    it('overwrites the pageInfo of the page with the pageInfo of the passed page', () => {
      const oldPageInfo = page.getPageInfo()

      page.merge(pageToBeMerged)

      expect(page.getPageInfo()).not.toEqual(oldPageInfo)
    })

    it('can merge a page with no nodes', () => {
      page.merge(new GraphQLPageMergeable<ProjectItem>(GithubObjectsTestData.getEmptyPagePOJO(), ProjectItem))
    })

    it('throws an error when attempting to merge a page with a different node class', () => {
      class DifferentNodeClass extends RecordWithGraphQLID {
        constructor () {
          super('id')
        }
      }

      expect(() => {
        page.merge(new GraphQLPageMergeable<ProjectItem>(GithubObjectsTestData.getProjectItemPagePOJOToBeMerged(), DifferentNodeClass))
      })
    })

    it("throws an error when attempting to merge a page with nodes that aren't instances of any class", () => {
      expect(() => {
        page.merge(new GraphQLPageMergeable<ProjectItem>(GithubObjectsTestData.getProjectItemPagePOJOToBeMerged()))
      })
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

  describe('disableColumnNameRemoteSearchSpace()', () => {
    let issue: Issue

    beforeEach(() => {
      issue = new Issue(GithubObjectsTestData.getIssuePOJOWithManyProjectItemsAndAllGraphQLPagesHavingAdditionalRemoteData())
    })

    it('marks the ProjectItem page as not having any additional remote records to fetch', () => {
      expect(issue.getProjectItemPage().hasNextPage()).toBe(true)

      issue.disableColumnNameRemoteSearchSpace()

      expect(issue.getProjectItemPage().hasNextPage()).toBe(false)
    })

    it('marks all child FieldValue graphql pages as not having any additional remote records to fetch', () => {
      const fieldValuePages = issue.getProjectItemPage().getNodeArray().map((projectItem) => {
        return projectItem.getFieldValuePage()
      })

      for (const fieldValuePage of fieldValuePages) {
        expect(fieldValuePage.hasNextPage()).toBe(true)
      }

      issue.disableColumnNameRemoteSearchSpace()

      for (const fieldValuePage of fieldValuePages) {
        expect(fieldValuePage.hasNextPage()).toBe(false)
      }
    })
  })

  describe('getId()', () => {
    it('returns the number of the Issue instance', () => {
      const issuePOJO = GithubObjectsTestData.getIssuePOJO()
      const issue = new Issue(issuePOJO)

      expect(issue.getId()).toBe(issuePOJO.id)
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

  describe('getProjectItemPage()', () => {
    it('returns the project item page of the Issue instance', () => {
      const issuePOJO = GithubObjectsTestData.getIssuePOJO()
      const issueProjectItemsPOJOCopy = structuredClone(issuePOJO.projectItems)
      const issue = new Issue(issuePOJO)

      expect(issue.getProjectItemPage()).toEqual(new GraphQLPageMergeable<ProjectItem>(issueProjectItemsPOJOCopy, ProjectItem))
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
    it('returns null if the column name could not be found', () => {
      const projectItemPOJO = GithubObjectsTestData.getProjectItemPOJOWithoutColumnName()
      const projectItem = new ProjectItem(projectItemPOJO)

      expect(projectItem.findColumnName()).toBe(null)
    })

    it('returns the column name on a successful search', () => {
      const projectItemPOJOCopy = GithubObjectsTestData.getProjectItemPOJO()
      const projectName = projectItemPOJOCopy.fieldValues.edges[0].node.name
      const projectItem = new ProjectItem(projectItemPOJOCopy)

      expect(projectItem.findColumnName()).toBe(projectName)
    })
  })

  describe('getFieldValuePage()', () => {
    it('returns the FieldValue page of the ProjectItem instance', () => {
      const projectItemPOJO = GithubObjectsTestData.getProjectItemPOJO()
      const projectItemFieldValuePagePOJOCopy = structuredClone(projectItemPOJO.fieldValues)
      const issue = new ProjectItem(projectItemPOJO)

      expect(issue.getFieldValuePage()).toEqual(new GraphQLPage<FieldValue>(projectItemFieldValuePagePOJOCopy, FieldValue))
    })
  })

  describe('getProjectHumanAccessibleUniqueIdentifiers()', () => {
    it('returns a ProjectPrimaryKeyHumanReadable instance', () => {
      const projectItemPOJO = GithubObjectsTestData.getProjectItemPOJO()
      const projectItem = new ProjectItem(projectItemPOJO)

      expect(projectItem.getProjectHumanReadablePrimaryKey()).toBeInstanceOf(ProjectPrimaryKeyHumanReadable)
    })

    it('returns a ProjectPrimaryKeyHumanReadable instance with number and name matching the original project item POJO', () => {
      const projectItemPOJO = GithubObjectsTestData.getProjectItemPOJO()
      const projectPOJO = projectItemPOJO.project
      const projectItem = new ProjectItem(projectItemPOJO)
      const projectKey = projectItem.getProjectHumanReadablePrimaryKey()

      expect(projectKey.getName()).toBe(projectPOJO.owner.login)
      expect(projectKey.getNumber()).toBe(projectPOJO.number)
    })
  })
})

describe('The ProjectPrimaryKeyHumanReadable class', () => {
  describe('asStringKey()', () => {
    it('returns the project owner name concatenated with the project number separated by a space', () => {
      const projectOwnerName = 'U]WA60G8Go[E@#\'flR'
      const projectNumber = 50943

      const projectKey = new ProjectPrimaryKeyHumanReadable(projectOwnerName, projectNumber)

      expect(projectKey.asStringKey()).toBe(`${projectOwnerName} ${projectNumber}`)
    })
  })

  describe('equals()', () => {
    it('returns true if the owner name and number of the passed ProjectPrimaryKeyHumanReadable instance are the same as the ProjectPrimaryKeyHumanReadable instance the method was called from', () => {
      const projectOwnerName = 'pL7d<~c[H=w0ZY|`N3'
      const projectNumber = 10934

      const projectKey = new ProjectPrimaryKeyHumanReadable(projectOwnerName, projectNumber)
      const projectKey1 = new ProjectPrimaryKeyHumanReadable(projectOwnerName, projectNumber)

      expect(projectKey.equals(projectKey1)).toBe(true)
    })

    it('returns true if the owner name and number of the passed ProjectPrimaryKeyHumanReadable instance are not the same as the ProjectPrimaryKeyHumanReadable instance the method was called from', () => {
      const projectOwnerName = 'W{%rdE&WTS3*U^Yi[K'
      const projectOwnerName1 = 'tg4<BJi=*DxfSf7|1-'
      const projectNumber = 10934
      const projectNumber1 = 48930

      const projectKey = new ProjectPrimaryKeyHumanReadable(projectOwnerName, projectNumber)
      const projectKey1 = new ProjectPrimaryKeyHumanReadable(projectOwnerName1, projectNumber)
      const projectKey2 = new ProjectPrimaryKeyHumanReadable(projectOwnerName, projectNumber1)
      const projectKey3 = new ProjectPrimaryKeyHumanReadable(projectOwnerName1, projectNumber1)

      expect(projectKey.equals(projectKey1)).toBe(false)
      expect(projectKey.equals(projectKey2)).toBe(false)
      expect(projectKey.equals(projectKey3)).toBe(false)
    })
  })

  describe('getName()', () => {
    it('returns the name passed into the constructor', () => {
      const projectOwnerName = 'DHNxjDU5U5`[C8@^4~'

      const projectKey = new ProjectPrimaryKeyHumanReadable(projectOwnerName, 98982)

      expect(projectKey.getName()).toBe(projectOwnerName)
    })
  })

  describe('getNumber()', () => {
    it('returns the number passed into the constructor', () => {
      const projectNumber = 34921

      const projectKey = new ProjectPrimaryKeyHumanReadable('', projectNumber)

      expect(projectKey.getNumber()).toBe(projectNumber)
    })
  })
})

describe('The RecordWithID class', () => {
  describe('getId', () => {
    it('returns the id of the record', () => {
      const id = '?1>Yd]i|IZfLJI?HGg'

      const stringIdRecord = new RecordWithGraphQLID(id)

      expect(stringIdRecord.getId()).toBe(id)
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
})
