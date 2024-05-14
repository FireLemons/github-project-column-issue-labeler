import * as TypeChecker from './typeChecker'

interface FieldValue {
  name: string // Column Name
}

interface ProjectItem {
  fieldValues: GraphQLPage<FieldValue>
}

export interface Label {
  name: string
}

export class GraphQLPage<T> {
  page: {
    edges: {
        node: T
    }[]

    pageInfo: {
      endCursor: string
      hasNextPage: boolean
    }
  }

  constructor (pageObject: any) {
    if (!(isGraphQLPage(pageObject))) {
      throw new TypeError('Param pageObject does not match a graphQL page')
    }

    this.page = pageObject
  }

  appendPage (page: GraphQLPage<T>) {
    this.page.edges.push(...page.#getEdges())
    this.page.pageInfo = page.getPageInfo()
  }

  getEndCursor () {
    return this.page.pageInfo.endCursor
  }

  getNodeArray () {
    return this.page.edges.map((edge) => {
      return edge.node
    })
  }

  getPageNodes (): T[] {
    return this.page.edges.map(edge => edge.node)
  }

  getPageInfo () {
    return this.page.pageInfo
  }

  isEmpty () {
    return this.#getEdges().length === 0
  }

  isLastPage () {
    return !(this.page.pageInfo.hasNextPage)
  }

  #getEdges () {
    return this.page.edges
  }
}

export class Issue {
  issue: {
    id: string
    number: number
    labels: GraphQLPage<Label>
    projectItems: GraphQLPage<ProjectItem>
  }

  constructor (issueObject: any) {
    if (!(isIssue(issueObject))) {
      throw new TypeError('Param issueObject does not match a github issue object')
    }

    // Init label page
    // Init projectItemPage

    this.issue = issueObject
  }

  findColumnName () {

  }

  getId () {
    return this.issue.id
  }

  getLabels () {

  }

  getNumber () {
    return this.issue.number
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
    TypeChecker.validateObjectMember(object['pageInfo'], 'endCursor', TypeChecker.Type.string)
    TypeChecker.validateObjectMember(object['pageInfo'], 'hasNextPage', TypeChecker.Type.boolean)
  } catch (error) {
    return false
  }

  for (const edge of object['edges']) {
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
    TypeChecker.validateObjectMember(object, 'labels', TypeChecker.Type.object)
    TypeChecker.validateObjectMember(object, 'projectItems', TypeChecker.Type.object)
  } catch (error) {
    return false
  }

  if (!(isGraphQLPage(object.labels) && isGraphQLPage(object.projectItems))) {
    return false
  }

  return true
}

function isLabel (object: any): boolean {
  try {
    TypeChecker.validateObjectMember(object, 'name', TypeChecker.Type.string)
  } catch (error) {
    return false
  }

  return true
}

function isProjectItem (object: any): boolean {
  try {
    TypeChecker.validateObjectMember(object, 'fieldValues', TypeChecker.Type.object)
  } catch (error) {
    return false
  }

  return isGraphQLPage(object.fieldValues)
}