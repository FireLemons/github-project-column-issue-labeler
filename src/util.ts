export type GenericObjectWithStringKeys = {
  [key: string]: any
}

export function caseInsensitiveAlphabetization (arr: string[]): string[] {
  return arr.toSorted(caseInsensitiveCompare)
}

/**
 * @returns -1 if str1 comes before str2, 0 if str1 and str2 are equivalent, 1 if str1 comes after str2
 */
export function caseInsensitiveCompare (str1: string, str2: string): number {
  return str1.localeCompare(str2, undefined, { sensitivity: 'base' })
}

export function firstKeyValuePairOfMap (map: Map<any, any>) {
  if (map.size === 0) {
    return undefined
  }

  const [key, value] = map.entries().next().value!

  return {
    key,
    value
  }
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

      if (value.constructor.name === 'Map') {
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
  const sortedArrayCopy = sortedArray.slice()

  let i = 0
  while (i < sortedArrayCopy.length - 1) {
    if (caseInsensitiveCompare(sortedArrayCopy[i], sortedArrayCopy[i + 1]) === 0) {
      sortedArrayCopy.splice(i + 1, 1)
    } else {
      i++
    }
  }

  return sortedArrayCopy
}
