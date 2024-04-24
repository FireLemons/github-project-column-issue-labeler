export function caseInsensitiveAlphabetization(arr: string[]): string[] {
  return arr.toSorted(caseInsensitiveCompare)
}

export function caseInsensitiveCompare (str1: string, str2: string): number{
  return str1.localeCompare(str2, undefined, {sensitivity: 'base'})
}

export function hasTrailingWhitespace(str: string): boolean {
  return str.trim() !== str
}

export function isCaseInsensitiveEqual(str1: string, str2: string): boolean {
  return caseInsensitiveCompare(str1, str2) === 0
}

export function removeCaseInsensitiveDuplicates (sortedArray: string[]): string[] {
  let i = 0
  while(i < sortedArray.length - 1) {
    if (!caseInsensitiveCompare(sortedArray[i], sortedArray[i + 1])) {
      sortedArray.splice(i + 1, 1)
    } else {
      i++
    }
  }

  return sortedArray
}