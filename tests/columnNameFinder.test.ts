import ColumnNameFinder from "../src/columnNameFinder"

describe('findColumnNames()', () => {
  describe('with a project key parameter', () => {
    it('returns the column name with a matching project key', () => {
      throw new Error('unimplimented')
    })

    it('returns empty array if no column names are in the search space', () => {
      throw new Error('unimplimented')
    })

    it('returns empty array if no column name could be found with a matching project key', () => {
      throw new Error('unimplimented')
    })

    it('caches the search result so it does not fetch the remote search space again', () => {
      throw new Error('unimplimented')
    })

    it('caches all column names found during the search so it does not fetch the remote search space again', () => {
      throw new Error('unimplimented')
    })
  })

  describe('without a project key parameter', () => {
    it('searches the entire search space for all column names', () => {
      throw new Error('unimplimented')
    })

    it('returns all column names in the search space', () => {
      throw new Error('unimplimented')
    })

    it('returns empty array if no column names are in the search space', () => {
      throw new Error('unimplimented')
    })

    it('caches the search result so it does not fetch the remote search space again', () => {
      throw new Error('unimplimented')
    })
  })
})

describe('getErrors()', () => {
  it('returns a list of errors thrown during the search', () => {
    throw new Error('unimplimented')
  })

  it('pairs the correct message with an error thrown by attempting to add a ProjectItem page', () => {
    throw new Error('unimplimented')
  })

  it('pairs the correct message with an error thrown by attempting to add a FieldValue page', () => {
    throw new Error('unimplimented')
  })

  it('pairs the correct message with an error thrown by attempting to add the extended column name search space', () => {
    throw new Error('unimplimented')
  })
})

describe('hasDisabledRemoteSearchSpace()', () => {
  it('returns true if all column name search space requested was successfully added to the local search space', () => {
    throw new Error('unimplimented')
  })

  it('returns false if all the column name search space could not be added to the local search space', () => {
    throw new Error('unimplimented')
  })
})