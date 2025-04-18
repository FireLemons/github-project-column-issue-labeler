import { GenericObjectWithStringKeys } from './util'

export enum Type {
  array = 'array',
  boolean = 'boolean',
  number = 'number',
  nullableString = 'string?',
  object = 'object',
  string = 'string'
}

export function isBoolean (obj: any): boolean {
  return typeof obj === 'boolean'
}

export function isObject (obj: any): boolean {
  return typeof obj === 'object' && !Array.isArray(obj) && obj !== null
}

export function isPositiveRealInteger (obj: any): boolean {
  return Number.isInteger(obj) && obj > 0
}

export function isString (obj: any): obj is string {
  return typeof obj === 'string'
}

export function validateObjectMember (obj: GenericObjectWithStringKeys, key: string, type: Type): void {
  if (!(key in obj)) {
    throw new ReferenceError(`key "${key}" was not found in the object`)
  }

  const member = obj[key]

  switch (type) {
    case Type.array:
      if (!(Array.isArray(member))) {
        throw new TypeError(`Member "${key}" was found not to be an array`)
      }

      break
    case Type.boolean:
      if (!(member === true || member === false)) {
        throw new TypeError(`Member "${key}" was found not to be a boolean`)
      }

      break
    case Type.number:
      if (isNaN(member)) {
        throw new TypeError(`Member "${key}" was found not to be a number`)
      }

      break
    case Type.nullableString:
      if (!isString(member) && member !== null) {
        throw new TypeError(`Member "${key}" was found not to be a string or null`)
      }

      break
    case Type.object:
      if (!isObject(member)) {
        throw new TypeError(`Member "${key}" was found not to be an object`)
      }
      break
    case Type.string:
      if (!isString(member)) {
        throw new TypeError(`Member "${key}" was found not to be a string`)
      }

      break
    default:
      throw new RangeError('Param type unsupported')
  }
}
