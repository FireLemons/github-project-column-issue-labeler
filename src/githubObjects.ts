import * as TypeChecker from './typeChecker'

interface Constructable<T> {
  new (...args: any[]): T
}

export interface RemoteRecordPageQueryParameters {
  parentId: string
  localPage: GraphQLPage<FieldValue> | GraphQLPage<Label> | GraphQLPageMergeable<ProjectItem>
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

export class RecordWithGraphQLID {
  #id: string

  constructor (uid: string) {
    this.#id = uid
  }

  getId () {
    return this.#id
  }
}

export class GraphQLPage<T> {
  nodeClass: Constructable<any> | undefined
  page: {
    edges: Array<{
        node: T
    }>

    pageInfo: {
      endCursor: string | null
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

  disableRemoteDataFetching () {
    this.page.pageInfo.hasNextPage = false
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

  hasNextPage () {
    return this.page.pageInfo.hasNextPage
  }

  isEmpty () {
    return this.getEdges().length === 0
  }

  lookupNodeClass () {
    return this.nodeClass
  }
}

export class GraphQLPageMergeable<T extends RecordWithGraphQLID> extends GraphQLPage<T> {
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

    if (!(firstNode instanceof RecordWithGraphQLID)) {
      throw new ReferenceError('Failed to merge pages. Page to be merged does not contain nodes with ids.')
    }

    for (const edge of page.getEdges()) {
      const { node } = edge
      const nodeId = node.getId()

      if (this.activeNodeFastAccessMap.has(nodeId)) {
        this.activeNodeFastAccessMap.get(nodeId)!.node = node
      } else if (!(this.deletedNodeIds.has(nodeId))){
        this.activeNodeFastAccessMap.set(nodeId, edge)
        this.page.edges.push(edge)
      }
    }

    this.page.pageInfo = page.getPageInfo()
  }
}

export class Issue {
  #columnNameMap: Map<string, string>
  #hasExpandedSearchSpace: boolean
  #hasInaccessibleRemoteSearchSpace: boolean
  #id: string
  labels?: GraphQLPage<Label>
  #number: number
  projectItems: GraphQLPageMergeable<ProjectItem>

  constructor (issuePOJO: any) {
    if (!(isIssue(issuePOJO))) {
      throw new TypeError('Param issuePOJO does not match a github issue object')
    }

    try {
      this.labels = new GraphQLPage(issuePOJO.labels, Label)
    } catch (error) {
      // It's fine. Labels aren't required.
    }

    try {
      this.projectItems = new GraphQLPageMergeable(issuePOJO.projectItems, ProjectItem)
    } catch (error) {
      throw new ReferenceError(`The project item page for issue with number:${issuePOJO.number} could not be initialized`)
    }

    this.#hasExpandedSearchSpace = false
    this.#hasInaccessibleRemoteSearchSpace = false
    this.#number = issuePOJO.number
    this.#id = issuePOJO.id

    this.#columnNameMap = new Map()
  }

  applyExpandedSearchSpace (expandedColumnNameSearchSpace: GraphQLPageMergeable<ProjectItem>) {
    this.projectItems.merge(expandedColumnNameSearchSpace)
    this.#hasExpandedSearchSpace = true
  }

  disableColumnNameRemoteSearchSpace ():void {
    const { projectItems } = this

    for(const projectItem of projectItems.getNodeArray()) {
      projectItem.getFieldValuePage().disableRemoteDataFetching()
    }

    projectItems.disableRemoteDataFetching()
  }

  findColumnName (projectKey?: ProjectPrimaryKeyHumanReadable) {
    const cachedSearch = this.#lookupCachedColumnName(projectKey)

    if (cachedSearch) {
      return cachedSearch
    }

    const remoteRecordQueryParams: RemoteRecordPageQueryParameters[] = []
    const projectItemEdges = this.projectItems.getEdges()

    let i = projectItemEdges.length - 1

    while (i >= 0) {
      const projectItem = projectItemEdges[i].node
      const columnNameSearchResult = projectItem.findColumnName()

      if (columnNameSearchResult === null) {
        this.projectItems.delete(i)
        i--
      } else if (TypeChecker.isString(columnNameSearchResult)) {
        this.projectItems.delete(i)
        i--

        this.#cacheSearchResult(projectItem)

        if (projectKey === undefined || projectItem.getProjectHumanReadablePrimaryKey().equals(projectKey)) {
          return columnNameSearchResult
        }
      } else {
        remoteRecordQueryParams.push(columnNameSearchResult)
        i--
      }
    }

    if (this.projectItems.hasNextPage()) {
      remoteRecordQueryParams.push({
        parentId: this.#id,
        localPage: this.projectItems
      })
    }

    return this.#determineRemoteQueryParams(remoteRecordQueryParams)
  }

  getId ():string {
    return this.#id
  }

  getLabels ():string[] | null {
    if (this.labels !== undefined) {
      return this.labels.getNodeArray().map((label: Label) => {
        return label.getName()
      })
    }

    return null
  }

  getNumber ():number {
    return this.#number
  }

  getProjectItemPage ():GraphQLPageMergeable<ProjectItem> {
    return this.projectItems
  }

  hasInaccessibleRemoteSearchSpace ():boolean {
    return this.#hasInaccessibleRemoteSearchSpace
  }

  markRemoteSearchSpaceAsNotCompletelyAcessible () {
    this.#hasInaccessibleRemoteSearchSpace = true
  }

  #cacheSearchResult (projectItem: ProjectItem) {
    this.#columnNameMap.set(projectItem.getProjectHumanReadablePrimaryKey().asStringKey(), projectItem.findColumnName() as string)
  }

  #determineRemoteQueryParams (remoteRecordQueryParams: RemoteRecordPageQueryParameters[]) {
    if (remoteRecordQueryParams.length === 0) {
      return null
    } else if (!(this.#hasExpandedSearchSpace)) {
      return this
    } else {
      return remoteRecordQueryParams
    }
  }

  #lookupCachedColumnName (projectKey?: ProjectPrimaryKeyHumanReadable) {
    if (projectKey === undefined) {
      return this.#columnNameMap.keys().next()?.value
    } else {
      return this.#columnNameMap.get(projectKey.asStringKey())
    }
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

export class ProjectItem extends RecordWithGraphQLID {
  columnName?: string
  #fieldValues: GraphQLPage<FieldValue>
  projectPrimaryKeyHumanReadable: ProjectPrimaryKeyHumanReadable

  constructor (projectItemPOJO: any) {
    if (!isProjectItem(projectItemPOJO)) {
      throw new TypeError('Param projectItemPOJO does not match a project item object')
    }

    super(projectItemPOJO.id)

    try {
      this.#fieldValues = new GraphQLPage(projectItemPOJO.fieldValues, FieldValue)
    } catch (error) {
      throw new ReferenceError('The field value page could not be initialized')
    }

    this.projectPrimaryKeyHumanReadable = new ProjectPrimaryKeyHumanReadable(projectItemPOJO.project.owner.login, projectItemPOJO.project.number)
  }

  findColumnName () {
    if (this.columnName !== undefined) {
      return this.columnName
    }

    const columnNameList = this.#fieldValues.getNodeArray()

    if (columnNameList.length !== 0) {
      this.columnName = columnNameList[0].getName()

      return this.columnName
    } else if (this.#fieldValues.hasNextPage()) {
      return {
        parentId: this.getId(),
        localPage: this.#fieldValues
      }
    }

    return null
  }

  getFieldValuePage () {
    return this.#fieldValues
  }

  getProjectHumanReadablePrimaryKey () {
    return this.projectPrimaryKeyHumanReadable
  }
}

export class ProjectPrimaryKeyHumanReadable {
  #name: string
  #number: number
  #stringKey: string

  constructor (name: string, number: number = 0) {
    this.#name = name
    this.#number = number
    this.#stringKey = `${name} ${number}`
  }

  asStringKey () {
    return this.#stringKey
  }

  equals (projectKey: ProjectPrimaryKeyHumanReadable) {
    return this.#stringKey === projectKey.asStringKey()
  }

  getName () {
    return this.#name
  }

  getNumber () {
    return this.#number
  }
}

function tryInitializeNode (GithubObjectClass: Constructable<any>, graphQLEdge: { node: any }) {
  try {
    graphQLEdge.node = new GithubObjectClass(graphQLEdge.node)

    return true
  } catch (error) {
    return false
  }
}

export function initializeNodes (GithubObjectClass: Constructable<any>, graphQLPage: GraphQLPage<any>): void {
  const edges = graphQLPage.getEdges()
  let i = edges.length - 1

  while (i >= 0) {
    if (!tryInitializeNode(GithubObjectClass, edges[i])) {
      edges.splice(i, 1)
    }

    i--
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

    const { pageInfo } = object

    TypeChecker.validateObjectMember(pageInfo, 'endCursor', TypeChecker.Type.nullableString)
    TypeChecker.validateObjectMember(pageInfo, 'hasNextPage', TypeChecker.Type.boolean)
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
    TypeChecker.validateObjectMember(object, 'id', TypeChecker.Type.string)
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
    TypeChecker.validateObjectMember(object, 'id', TypeChecker.Type.string)
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
