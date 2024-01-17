enum Type {
  string = 'string',
  array = 'array'
}

interface objectWithKeys {
  [key: string]: any
}

function isObject(obj: any):boolean {
  return typeof obj === 'object' && !Array.isArray(obj) && obj !== null
}

function isString(obj: any): obj is string {
  return typeof obj === 'string'
}

function validateObjectMember(obj: objectWithKeys, key: string, type: Type): void {
  if (!(key in obj)){
    throw new ReferenceError(`key "${key}" was not found in the object`)
  }

  const member = obj[key]

  switch (type) {
    case Type.array:
      if(!(Array.isArray(member))) {
        throw new TypeError(`Member "${key}" was found not to be an array`)
      }

      break;
    case Type.string:
      if (!isString(member)) {
        throw new TypeError(`Member "${key}" was found not to be a string`)
      }

      break;
  }
}

module.exports = {
  isObject: isObject,
  isString: isString,
  validateObjectMember: validateObjectMember,
  types: Type
}