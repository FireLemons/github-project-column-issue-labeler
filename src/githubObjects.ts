import * as TypeChecker from './typeChecker'

interface ColumnName {
  fieldValues: {
    nodes: [
      {
        name?: string
      }
    ]
  }
}

export interface IssueWithChildPages {
  id: string
  labels: GraphQLPage<Label>
  projectItems: GraphQLPage<ColumnName>
}

export interface Label {
  name: string
}

export interface GraphQLPage<T> {
  edges: [
    {
      node: T
    }
  ]
  pageInfo: {
    endCursor: string
    hasNextPage: boolean
  }
}

function isGraphQLPage (object: any): object is GraphQLPage<any> {
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

export class GraphQLPage<T> {
  page: GraphQLPage<T>

  constructor (pageObject: any) {
    if (!(isGraphQLPage(pageObject))) {
      throw new TypeError('Param pageObject is not an instance of a GraphQLPage')
    }

    this.page = pageObject
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

  getPageNodes (): T[] {
    return this.page.edges.map(edge => edge.node)
  }

  getPageInfo () {
    return this.page.pageInfo
  }

  isLastPage () {
    return !(this.page.pageInfo.hasNextPage)
  }
}