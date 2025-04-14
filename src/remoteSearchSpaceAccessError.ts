export enum GraphQLPageType {
  EXPANDED_SEARCH_SPACE = 'EXPANDED_SEARCH_SPACE',
  FIELD_VALUE_PAGE = 'FIELD_VALUE_PAGE',
  PROJECT_ITEM_PAGE = 'PROJECT_ITEM_PAGE',
  UNDEFINED = 'UNDEFINED'
}

export class GraphQLPageAccessError extends Error {
  #graphQLPageType: GraphQLPageType

  constructor (graphQLPageType: GraphQLPageType, message?: string, options?: ErrorOptions) {
    super(message, options)

    this.#graphQLPageType = graphQLPageType
  }

  getPageType () {
    return this.#graphQLPageType
  }
}