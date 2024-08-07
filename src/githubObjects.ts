import * as TypeChecker from './typeChecker'

interface Constructable<T> {
  new (...args: any[]): T
}

export interface RemoteRecordPageQueryParameters {
  parentId?: number | string
  recordPage: GraphQLPage<FieldValue | Issue | Label | ProjectItem>
}

export class FieldValue {
  name: string // Column Name

  constructor (fieldValuePOJO: any) {
    if (!isFieldValue(fieldValuePOJO)) {
      throw new TypeError('Param fieldValuePOJO does not match a field value object')
    }

    this.name = fieldValuePOJO.name
  }

  getName () {
    return this.name
  }
}

export class RecordWithID {
  id: number | string

  constructor (uid: number | string) {
    this.id = uid
  }

  getId () {
    return this.id
  }
}

export class GraphQLPage<T> {
  nodeClass: Constructable<any> | undefined
  page: {
    edges: Array<{
        node: T
    }>

    pageInfo: {
      endCursor: string
      hasNextPage: boolean
    }
  }

  constructor (pagePOJO: any, NodeClass?: Constructable<any>) {
    if (!(isGraphQLPage(pagePOJO))) {
      throw new TypeError('Param pagePOJO does not match a graphQL page')
    }

    this.page = pagePOJO
    this.nodeClass = NodeClass

    if (NodeClass !== undefined) {
      initializeNodes(NodeClass, this)
    }
  }

  appendPage (page: GraphQLPage<T>) {
    this.page.edges.push(...page.getEdges())
    this.page.pageInfo = page.getPageInfo()
  }

  delete (index: number): T {
    if (0 > index || index >= this.page.edges.length) {
      throw new RangeError('Param index out of range')
    }

    return this.page.edges.splice(index, 1)[0].node
  }

  getEdges () {
    return this.page.edges
  }

  getEndCursor () {
    return this.page.pageInfo.endCursor
  }

  getNodeArray () {
    return this.page.edges.map(edge => edge.node)
  }

  getPageInfo () {
    return this.page.pageInfo
  }

  isEmpty () {
    return this.getEdges().length === 0
  }

  isLastPage () {
    return !(this.page.pageInfo.hasNextPage)
  }

  lookupNodeClass () {
    return this.nodeClass
  }
}

export class GraphQLPageMergeable<T extends RecordWithID> extends GraphQLPage<T> {
  activeNodeFastAccessMap: Map<string | number, { node: T }>
  deletedNodeIds: Map<string | number, null>

  constructor (pagePOJO: any, NodeClass?: Constructable<any>) {
    super(pagePOJO, NodeClass)

    this.activeNodeFastAccessMap = new Map()

    for (const edge of this.page.edges) {
      const { node } = edge

      this.activeNodeFastAccessMap.set(node.getId(), edge)
    }

    this.deletedNodeIds = new Map()
  }

  delete (index: number): T {
    if (0 > index || index >= this.page.edges.length) {
      throw new RangeError('Param index out of range')
    }

    const deletedNode = this.page.edges.splice(index, 1)[0].node
    const deletedNodeId = deletedNode.getId()

    this.activeNodeFastAccessMap.delete(deletedNodeId)
    this.deletedNodeIds.set(deletedNodeId, null)

    return deletedNode
  }

  merge (page: GraphQLPageMergeable<T>) {
    const firstNode = this.page.edges[0].node

    if (!(firstNode instanceof RecordWithID)) {
      throw new ReferenceError('Failed to merge pages. Page to be merged does not contain nodes with ids.')
    }

    for (const edge of page.getEdges()) {
      const { node } = edge
      const nodeId = node.getId()

      if (this.deletedNodeIds.has(nodeId)) {
        continue
      }

      if (this.activeNodeFastAccessMap.has(nodeId)) {
        this.activeNodeFastAccessMap.get(nodeId)!.node = node
      } else {
        this.activeNodeFastAccessMap.set(nodeId, edge)
        this.page.edges.push(edge)
      }
    }

    this.page.pageInfo = page.getPageInfo()
  }
}

export class Issue {
  issue: {
    number: number
    labels?: GraphQLPage<Label>
    projectItems: GraphQLPage<ProjectItem>
  }

  constructor (issuePOJO: any) {
    if (!(isIssue(issuePOJO))) {
      throw new TypeError('Param issuePOJO does not match a github issue object')
    }

    const issueState: any = {
      number: issuePOJO.number
    }

    try {
      issueState.labels = new GraphQLPage(issuePOJO.labels, Label)
    } catch (error) {
      issuePOJO.labels = undefined
    }

    try {
      issueState.projectItems = new GraphQLPage(issuePOJO.projectItems, ProjectItem)
    } catch (error) {
      throw new ReferenceError(`The project item page for issue with number:${issuePOJO.number} could not be initialized`)
    }

    this.issue = issueState
  }

  findColumnName (projectNumber?: number, projectOwnerLogin?: string) {
    const remoteRecordQueryParams: RemoteRecordPageQueryParameters[] = []
    const projectEdges = this.issue.projectItems.getEdges()

    let i = projectEdges.length

    while (i > 0) {
      i--

      const projectItem = projectEdges[i].node
      const projectItemHumanAccessibleUniqueIdentifiers = projectItem.getProjectHumanAccessibleUniqueIdentifiers()
      const columnNameSearchResult = projectItem.findColumnName()

      if (columnNameSearchResult === null) {
        this.issue.projectItems.delete(i)
      } else if (TypeChecker.isString(columnNameSearchResult)) {
        if (projectOwnerLogin && projectOwnerLogin !== projectItemHumanAccessibleUniqueIdentifiers.ownerLoginName) {
          continue
        }

        if (projectNumber && projectNumber !== projectItemHumanAccessibleUniqueIdentifiers.number) {
          continue
        }

        return columnNameSearchResult
      } else {
        remoteRecordQueryParams.push(columnNameSearchResult)
      }
    }

    if (!(this.issue.projectItems.isLastPage())) {
      remoteRecordQueryParams.push({
        parentId: this.issue.number,
        recordPage: this.issue.projectItems
      })
    }

    if (remoteRecordQueryParams.length !== 0) {
      return remoteRecordQueryParams
    } else {
      return null
    }
  }

  getLabels () {
    if (this.issue.labels !== undefined) {
      return this.issue.labels.getNodeArray().map((label: Label) => {
        return label.getName()
      })
    }

    return null
  }

  getNumber () {
    return this.issue.number
  }
}

export class Label {
  name: string

  constructor (labelPOJO: any) {
    if (!isLabel(labelPOJO)) {
      throw new TypeError('Param labelPOJO does not match a label object')
    }

    this.name = labelPOJO.name
  }

  getName () {
    return this.name
  }
}

export class ProjectItem extends RecordWithID {
  columnName?: string
  fieldValues: GraphQLPage<FieldValue>
  declare id: number
  projectHumanReadableUniqueIdentifiers: {
    number: number
    ownerLoginName: string
  }

  constructor (projectItemPOJO: any) {
    if (!isProjectItem(projectItemPOJO)) {
      throw new TypeError('Param projectItemPOJO does not match a project item object')
    }

    super(projectItemPOJO.databaseId)

    try {
      this.fieldValues = new GraphQLPage(projectItemPOJO.fieldValues, FieldValue)
    } catch (error) {
      throw new ReferenceError('The field value page could not be initialized')
    }

    this.projectHumanReadableUniqueIdentifiers = {
      number: projectItemPOJO.project.number,
      ownerLoginName: projectItemPOJO.project.owner.login
    }
  }

  findColumnName () {
    if (this.columnName !== undefined) {
      return this.columnName
    }

    const columnNameList = this.fieldValues.getNodeArray()

    if (columnNameList.length !== 0) {
      this.columnName = columnNameList[0].getName()

      return this.columnName
    } else if (!(this.fieldValues.isLastPage())) {
      return {
        parentId: this.getId(),
        recordPage: this.fieldValues
      }
    }

    return null
  }

  getProjectHumanAccessibleUniqueIdentifiers () {
    return this.projectHumanReadableUniqueIdentifiers
  }
}

export function initializeNodes (GithubObjectClass: Constructable<any>, graphQLPage: GraphQLPage<any>): void {
  let i = 0
  const edges = graphQLPage.getEdges()

  while (i < edges.length) {
    try {
      edges[i] = {
        node: new GithubObjectClass(edges[i].node)
      }

      i++
    } catch (error) {
      edges.splice(i, 1)
    }
  }
}

function isFieldValue (object: any): boolean {
  try {
    TypeChecker.validateObjectMember(object, 'name', TypeChecker.Type.string)
  } catch (error) {
    return false
  }

  return true
}

function isGraphQLPage (object: any): boolean {
  if (!(TypeChecker.isObject(object))) {
    return false
  }

  try {
    TypeChecker.validateObjectMember(object, 'edges', TypeChecker.Type.array)
    TypeChecker.validateObjectMember(object, 'pageInfo', TypeChecker.Type.object)
    TypeChecker.validateObjectMember(object.pageInfo, 'endCursor', TypeChecker.Type.string)
    TypeChecker.validateObjectMember(object.pageInfo, 'hasNextPage', TypeChecker.Type.boolean)
  } catch (error) {
    return false
  }

  for (const edge of object.edges) {
    try {
      TypeChecker.validateObjectMember(edge, 'node', TypeChecker.Type.object)
    } catch (error) {
      return false
    }
  }

  return true
}

function isIssue (object: any): boolean {
  if (!(TypeChecker.isObject(object))) {
    return false
  }

  try {
    TypeChecker.validateObjectMember(object, 'number', TypeChecker.Type.number)
    TypeChecker.validateObjectMember(object, 'projectItems', TypeChecker.Type.object)
  } catch (error) {
    return false
  }

  return true
}

function isLabel (object: any): boolean {
  if (!(TypeChecker.isObject(object))) {
    return false
  }

  try {
    TypeChecker.validateObjectMember(object, 'name', TypeChecker.Type.string)
  } catch (error) {
    return false
  }

  return true
}

function isProjectItem (object: any): boolean {
  if (!(TypeChecker.isObject(object))) {
    return false
  }

  try {
    TypeChecker.validateObjectMember(object, 'databaseId', TypeChecker.Type.number)
    TypeChecker.validateObjectMember(object, 'fieldValues', TypeChecker.Type.object)
    TypeChecker.validateObjectMember(object, 'project', TypeChecker.Type.object)

    const { project } = object

    TypeChecker.validateObjectMember(project, 'number', TypeChecker.Type.number)
    TypeChecker.validateObjectMember(project, 'owner', TypeChecker.Type.object)
    TypeChecker.validateObjectMember(project.owner, 'login', TypeChecker.Type.string)
  } catch (error) {
    return false
  }

  return true
}
