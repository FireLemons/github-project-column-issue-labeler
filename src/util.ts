export type GenericObjectWithStringKeys = {
  [key: string]: any
}

export function caseInsensitiveAlphabetization (arr: string[]): string[] {
  return arr.toSorted(caseInsensitiveCompare)
}

export function caseInsensitiveCompare (str1: string, str2: string): number{
  return str1.localeCompare(str2, undefined, { sensitivity: 'base' })
}

export function combineSortedCaseInsensititveUniqueStringArrays (sortedArr1: string[], sortedArr2: string[]) {

}

export function hasTrailingWhitespace (str: string): boolean {
  return str.trim() !== str
}

export function isCaseInsensitiveEqual (str1: string, str2: string): boolean {
  return caseInsensitiveCompare(str1, str2) === 0
}

export function nestedMapsToObject (rootMap: Map<any, any>) {
  const rootContainer: GenericObjectWithStringKeys = {}

  const mapProcessStack = [{
    key: '0',
    map: rootMap,
    parentObject: rootContainer
  }]

  while(mapProcessStack.length > 0) {
    const { map, key, parentObject} = mapProcessStack.pop()!

    const mapAsObject = Object.fromEntries(map.entries())

    for (const newObjectKey in mapAsObject) {
      const value = mapAsObject[newObjectKey]

      if(value instanceof Map) {
        mapProcessStack.push({
          key: newObjectKey,
          map: value,
          parentObject: mapAsObject
        })
      }
    }

    parentObject[key] = mapAsObject
  }

  return rootContainer['0']
}

export function removeCaseInsensitiveDuplicatesFromSortedArray (sortedArray: string[]): string[] {
  let i = 0
  while (i < sortedArray.length - 1) {
    if (caseInsensitiveCompare(sortedArray[i], sortedArray[i + 1]) === 0) {
      sortedArray.splice(i + 1, 1)
    } else {
      i++
    }
  }

  return sortedArray
}
