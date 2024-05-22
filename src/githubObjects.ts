import * as TypeChecker from './typeChecker'

interface Constructable<T> {
  new (...args: any[]): T;
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

  constructor (pagePOJO: any) {
    if (!(isGraphQLPage(pagePOJO))) {
      throw new TypeError('Param pagePOJO does not match a graphQL page')
    }

    this.page = pagePOJO
  }

  appendPage (page: GraphQLPage<T>) {
    this.page.edges.push(...page.getEdges())
    this.page.pageInfo = page.getPageInfo()
  }

  getEdges () {
    return this.page.edges
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
    return this.getEdges().length === 0
  }

  isLastPage () {
    return !(this.page.pageInfo.hasNextPage)
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
      issueState.labels = new GraphQLPage(issuePOJO.labels)
      initializeNodes(Label, issueState.labels)
    } catch (error) {
      issuePOJO.labels = undefined
    }

    try {
      issueState.projectItems = new GraphQLPage(issuePOJO.projectItems)
      initializeNodes(ProjectItem, issueState.projectItems)
    } catch (error) {
      throw new ReferenceError(`The project item page for issue with number:${issuePOJO.number} could not be initialized`)
    }

    this.issue = issueState
  }

  findColumnName () {

  }

  getLabels () {
    if (this.issue.labels) {
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

export class ProjectItem {
  columnName?: string
  fieldValues: GraphQLPage<FieldValue>

  constructor (projectItemPOJO: any) {
    if (!isProjectItem(projectItemPOJO)) {
      TypeError('Param projectItemPOJO does not match a project item object')
    }

    try {
      projectItemPOJO.fieldValues = new GraphQLPage(projectItemPOJO.fieldValues)
      initializeNodes(FieldValue, projectItemPOJO.projectItemPage)
    } catch (error) {
      throw new ReferenceError(`The field value page could not be initialized`)
    }

    this.fieldValues = projectItemPOJO.fieldValues
  }

  findColumnName () {
    if (this.columnName) {
      return this.columnName
    }

    const columnNameList = this.fieldValues.getNodeArray()

    if (columnNameList.length) {
      this.columnName = columnNameList[0].getName()

      return this.columnName
    } else if (this.fieldValues.isLastPage()) {
      throw new ReferenceError('Failed to find column name when searching incomplete field value pages')
    }

    return null
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
    TypeChecker.validateObjectMember(object, 'number', TypeChecker.Type.number)
    TypeChecker.validateObjectMember(object, 'labels', TypeChecker.Type.object)
    TypeChecker.validateObjectMember(object, 'projectItems', TypeChecker.Type.object)
  } catch (error) {
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

  return true
}