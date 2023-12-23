enum Type {
  string = 'string',
  array = 'array'
}

module.exports = {
  isObject: function (obj: any):boolean {
    return typeof obj === 'object' && !Array.isArray(obj) && obj !== null
  },

  isString: (obj: any): obj is string => {
    return typeof obj === 'string'
  },

  validateObjectMember: (obj: object, key: string, type: Type): void => {
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
        if (!this.isString(member)) {
          throw new TypeError(`Member "${key}" was found not to be an string`)
        }

        break; 
    }
  },

  types: Type
}