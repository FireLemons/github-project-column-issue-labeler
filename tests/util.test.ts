import { 
  caseInsensitiveAlphabetization,
  caseInsensitiveCompare,
  hasTrailingWhitespace,
  isCaseInsensitiveEqual,
  removeCaseInsensitiveDuplicates
} from '../src/util'

describe('caseInsensitiveAlphabetization()', () => {

})

describe('caseInsensitiveCompare()', () => {

})

describe('hasTrailingWhitespace()', () => {
  it ('returns true when passed a string with trailing whitespace', () => {
    expect(hasTrailingWhitespace(' whitespace ')).toBe(true)
  })

  it ('returns false when passed a string without trailing whitespace', () => {
    expect(hasTrailingWhitespace('no whitespace')).toBe(false)
  })
})

describe('isCaseInsensitiveEqual()', () => {

})

describe('removeCaseInsensitiveDuplicates()', () => {

})