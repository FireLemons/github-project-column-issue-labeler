interface objectWithKeys {
  [key: string]: any
}

export enum Type {
  array = 'array',
  boolean = 'boolean',
  number = 'number',
  object = 'object',
  string = 'string'
}

export function isObject(obj: any): boolean {
  return typeof obj === 'object' && !Array.isArray(obj) && obj !== null
}

export function isString(obj: any): obj is string {
  return typeof obj === 'string'
}

export function validateObjectMember(obj: objectWithKeys, key: string, type: Type): void {
  if (!(key in obj)){
    throw new ReferenceError(`key "${key}" was not found in the object`)
  }

  const member = obj[key]

  switch (type) {
    case Type.array:
      if (!(Array.isArray(member))) {
        throw new TypeError(`Member "${key}" was found not to be an array`)
      }

      break;
    case Type.boolean:
      if (!(member === true || member === false)) {
        throw new TypeError(`Member "${key}" was found not to be a boolean`)
      }

      break;
    case Type.number:
      if (isNaN(member)) {
        throw new TypeError(`Member "${key}" was found not to be a number`)
      }

      break;
    case Type.object:
      if (!isObject(member)) {
        throw new TypeError(`Member "${key}" was found not to be an object`)
      }
      break;
    case Type.string:
      if (!isString(member)) {
        throw new TypeError(`Member "${key}" was found not to be a string`)
      }

      break;
    default:
      throw new RangeError('Param type unsupported')
  }
}