import { FieldValuePOJO, GraphQLPagePOJO } from './githubAPIClient'
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
  #endCursor: string | null
  #hasNextPage: boolean
  nodeClass: Constructable<any> | undefined
  #nodeArray: T[]

  constructor (pagePOJO: any, NodeClass?: Constructable<any>) {
    if (!(isGraphQLPage(pagePOJO))) {
      throw new TypeError('Param pagePOJO does not match a graphQL page')
    }

    this.#endCursor = pagePOJO.pageInfo.endCursor
    this.#hasNextPage = pagePOJO.pageInfo.hasNextPage
    this.nodeClass = NodeClass

    if (NodeClass !== undefined) {
      this.#nodeArray = initializeNodes<T>(NodeClass, pagePOJO.edges)
    } else {
      this.#nodeArray = pagePOJO.edges.map((edge) => {
        return edge.node
      })
    }
  }

  appendPage (page: GraphQLPage<T>) {
    if (page.lookupNodeClass() !== this.nodeClass) {
      throw new TypeError('Node type mismatch between pages')
    }

    this.#hasNextPage = page.hasNextPage()
    this.#endCursor = page.getEndCursor()
    this.#nodeArray.push(...page.getNodeArray())
  }

  disableRemoteDataFetching () {
    this.#hasNextPage = false
  }

  getEndCursor () {
    return this.#endCursor
  }

  getNodeArray () {
    return this.#nodeArray
  }

  hasNextPage () {
    return this.#hasNextPage
  }

  isEmpty () {
    return this.getNodeArray().length === 0
  }

  lookupNodeClass () {
    return this.nodeClass
  }

  updatePageInfo (endCursor: string | null, hasNextPage: boolean) {
    this.#endCursor = endCursor
    this.#hasNextPage = hasNextPage
  }
}

export class GraphQLPageMergeable<T extends RecordWithGraphQLID> extends GraphQLPage<T> {
  activeNodeFastAccessMap: Map<string | number, T>
  deletedNodeIds: Map<string | number, null>

  constructor (pagePOJO: any, NodeClass: Constructable<any>) {
    super(pagePOJO, NodeClass)

    this.activeNodeFastAccessMap = new Map()
    this.deletedNodeIds = new Map()

    for (const node of initializeNodes<T>(NodeClass, pagePOJO.edges)) {
      this.activeNodeFastAccessMap.set(node.getId(), node)
    }
  }

  delete (id: number | string): T {
    const deletedNode = this.activeNodeFastAccessMap.get(id)

    if (deletedNode === undefined) {
      throw new RangeError(`Node with id:"${id}" not found for deletion`)
    }

    this.activeNodeFastAccessMap.delete(id)
    this.deletedNodeIds.set(id, null)

    return deletedNode
  }

  getNodeArray(): T[] {
    return [...this.activeNodeFastAccessMap.values()]
  }

  merge (page: GraphQLPageMergeable<T>) {
    const PageToBeMergedNodeClass = page.lookupNodeClass()

    if (PageToBeMergedNodeClass !== this.nodeClass) {
      throw new TypeError('Node type mismatch between pages')
    }

    for (const node of page.getNodeArray()) {
      const nodeId = node.getId()

      if (!(this.deletedNodeIds.has(nodeId))) {
        this.activeNodeFastAccessMap.set(nodeId, node)
      }
    }

    this.updatePageInfo(page.getEndCursor(), page.hasNextPage())
  }
}

export class Issue {
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

    this.#number = issuePOJO.number
    this.#id = issuePOJO.id
  }

  disableColumnNameRemoteSearchSpace (): void {
    const { projectItems } = this

    for (const projectItem of projectItems.getNodeArray()) {
      projectItem.getFieldValuePage().disableRemoteDataFetching()
    }

    projectItems.disableRemoteDataFetching()
  }

  getId (): string {
    return this.#id
  }

  getLabelPage (): GraphQLPage<Label> | null {
    if (this.labels === undefined) {
      return null
    }

    return this.labels
  }

  getNumber (): number {
    return this.#number
  }

  getProjectItemPage (): GraphQLPageMergeable<ProjectItem> {
    return this.projectItems
  }
}

export class Label {
  #name: string

  constructor (labelPOJO: any) {
    if (!isLabel(labelPOJO)) {
      throw new TypeError('Param labelPOJO does not match a label object')
    }

    this.#name = labelPOJO.name
  }

  getName () {
    return this.#name
  }
}

export class ProjectItem extends RecordWithGraphQLID {
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
    const columnNameList = this.#fieldValues.getNodeArray()

    // Assuming a project item can only contain one column name

    if (columnNameList.length !== 0) {
      return columnNameList[0].getName()
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
  #ownerName: string
  #number: number
  #stringKey: string

  constructor (ownerName: string, number?: number) {
    if (number !== undefined) {
      if (!(TypeChecker.isPositiveRealInteger(number))) {
        throw new TypeError('param number must be an integer greater than 0')
      }
    } else {
      number = 0
    }

    this.#ownerName = ownerName
    this.#number = number
    this.#stringKey = `${ownerName} ${number}`
  }

  asPOJO () {
    return {
      ownerName: this.#ownerName,
      number: this.#number
    }
  }

  equals (projectKey: ProjectPrimaryKeyHumanReadable) {
    return this.#ownerName === projectKey.getName() && this.#number === projectKey.getNumber()
  }

  getName () {
    return this.#ownerName
  }

  getNumber () {
    return this.#number
  }

  hasNumber () {
    return this.#number !== 0
  }
}

function tryInitializeNode<T> (GithubObjectClass: Constructable<any>, nodePOJO: any): T | null {
  try {
    const initializedNode = new GithubObjectClass(nodePOJO)

    return initializedNode
  } catch (error) {
    return null
  }
}

export function initializeNodes<T> (GithubObjectClass: Constructable<any>, edges: { node: any }[]): T[] {
  const initializedNodes = []

  for (const edge of edges) {
    const nodeInitializationResult = tryInitializeNode<T>(GithubObjectClass, edge.node)

    if (nodeInitializationResult !== null) {
      initializedNodes.push(nodeInitializationResult)
    }
  }

  return initializedNodes
}

function isFieldValue (object: any): object is FieldValuePOJO {
  try {
    TypeChecker.validateObjectMember(object, 'name', TypeChecker.Type.string)
  } catch (error) {
    return false
  }

  return true
}

function isGraphQLPage (object: any): object is GraphQLPagePOJO<any> {
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
