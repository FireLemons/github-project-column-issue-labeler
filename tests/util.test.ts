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
  it('returns -1 when the first argument comes before the second argument alphabetically', () => {
    expect(caseInsensitiveCompare('A', 'b')).toBe(-1)
  })

  it('returns 0 when both arguments contain the same letters in the same order', () => {
    expect(caseInsensitiveCompare('A', 'a')).toBe(0)
  })

  it('returns 1 when the first argument comes after the second argument alphabetically', () => {
    expect(caseInsensitiveCompare('b', 'A')).toBe(1)
  })
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