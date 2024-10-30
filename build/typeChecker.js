"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateObjectMember = exports.isString = exports.isObject = exports.Type = void 0;
var Type;
(function (Type) {
    Type["array"] = "array";
    Type["boolean"] = "boolean";
    Type["number"] = "number";
    Type["nullableString"] = "string?";
    Type["object"] = "object";
    Type["string"] = "string";
})(Type || (exports.Type = Type = {}));
function isObject(obj) {
    return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
}
exports.isObject = isObject;
function isString(obj) {
    return typeof obj === 'string';
}
exports.isString = isString;
function validateObjectMember(obj, key, type) {
    if (!(key in obj)) {
        throw new ReferenceError(`key "${key}" was not found in the object`);
    }
    const member = obj[key];
    switch (type) {
        case Type.array:
            if (!(Array.isArray(member))) {
                throw new TypeError(`Member "${key}" was found not to be an array`);
            }
            break;
        case Type.boolean:
            if (!(member === true || member === false)) {
                throw new TypeError(`Member "${key}" was found not to be a boolean`);
            }
            break;
        case Type.number:
            if (isNaN(member)) {
                throw new TypeError(`Member "${key}" was found not to be a number`);
            }
            break;
        case Type.nullableString:
            if (!isString(member) && member !== null) {
                throw new TypeError(`Member "${key}" was found not to be a string or null`);
            }
            break;
        case Type.object:
            if (!isObject(member)) {
                throw new TypeError(`Member "${key}" was found not to be an object`);
            }
            break;
        case Type.string:
            if (!isString(member)) {
                throw new TypeError(`Member "${key}" was found not to be a string`);
            }
            break;
        default:
            throw new RangeError('Param type unsupported');
    }
}
exports.validateObjectMember = validateObjectMember;
