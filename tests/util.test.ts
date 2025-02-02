import { 
  caseInsensitiveAlphabetization,
  caseInsensitiveCompare,
  hasTrailingWhitespace,
  isCaseInsensitiveEqual,
  nestedMapsToObject,
  removeCaseInsensitiveDuplicatesFromSortedArray
} from '../src/util'

describe('caseInsensitiveAlphabetization()', () => {
  it ('alphabetizes an array of stings', () => {
    function makeShuffledArray(arr: any[]) { // https://en.wikipedia.org/wiki/Fisher-Yates_shuffle#The_modern_algorithm
      const arrCopy = arr.slice()

      for (let i = arrCopy.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1))
        let temp = arrCopy[i]
        arrCopy[i] = arrCopy[j]
        arrCopy[j] = temp
      }

      return arrCopy
    }

    const alphabetArray = ['A', 'b', 'C', 'd', 'E', 'f', 'G', 'h', 'I', 'j', 'K', 'l', 'M', 'n', 'O', 'p', 'Q', 'r', 'S', 't', 'U', 'v', 'W', 'x', 'Y', 'z']
    const shuffledArray = makeShuffledArray(alphabetArray)

    expect(shuffledArray).not.toEqual(alphabetArray)
    expect(caseInsensitiveAlphabetization(shuffledArray)).toEqual(alphabetArray)
  })
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
  it('returns true when both arguments contain the same letters in the same order', () => {
    expect(isCaseInsensitiveEqual('AzZ', 'azz')).toBe(true)
  })

  it('returns false when both arguments do not contain the same letters in the same order', () => {
    expect(isCaseInsensitiveEqual('AzZ', ' azz')).toBe(false)
  })
})

describe('nestedMapsToObject()', () => {
  it('returns an empty object when passed an empty map', () => {
    expect(nestedMapsToObject(new Map())).toEqual({})
  })

  it('can convert deeply nested maps to objects', () => {
    const nestedMaps = new Map([
      ['depth1', new Map([
        ['depth2', new Map([
          ['depth3', new Map([
            ['depth4', true]
          ])]
        ])]
      ])],
    ])

    const nestedMapsObjectAnalog = {
      depth1: {
        depth2: {
          depth3: {
            depth4: true
          }
        }
      }
    }

    expect(nestedMapsToObject(nestedMaps)).toEqual(nestedMapsObjectAnalog)
  })

  it('can convert multiple submaps of a map to objects', () => {
    const highBranchingMaps = new Map([
      ['branchA', new Map([
        ['a', 'a']
      ])],
      ['branchB', new Map([
        ['b', 'b']
      ])],
      ['branchC', new Map([
        ['c', 'c']
      ])],
      ['branchD', new Map([
        ['d', 'd']
      ])]
    ])

    const highBranchingMapsObjectAnalog = {
      branchA: {
        a: 'a'
      },
      branchB: {
        b: 'b'
      },
      branchC: {
        c: 'c'
      },
      branchD: {
        d: 'd'
      }
    }

    expect(nestedMapsToObject(highBranchingMaps)).toEqual(highBranchingMapsObjectAnalog)
  })
})

describe('removeCaseInsensitiveDuplicatesFromSortedArray()', () => {
  it('removes duplicate words from an array, ignoring their case', () => {
    const originalWords = ['AaAa', 'bAnM', 'RtIl', 'GmSl']
    const words = originalWords.slice()

    for (let i = 0; i < 5; i++) {
      const selectedIndex = Math.floor(Math.random() * 4)
      const randomWord = words[selectedIndex]

      words.splice(selectedIndex + 1, 0, Math.floor(Math.random() * 2) ? randomWord.toLowerCase() : randomWord.toUpperCase())
    }

    expect(words.length).toBeGreaterThan(4)

    removeCaseInsensitiveDuplicatesFromSortedArray(words)

    expect(words).toEqual(originalWords)
  })
})
