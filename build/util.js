"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCaseInsensitiveDuplicatesFromSortedArray = exports.isCaseInsensitiveEqual = exports.hasTrailingWhitespace = exports.caseInsensitiveCompare = exports.caseInsensitiveAlphabetization = void 0;
function caseInsensitiveAlphabetization(arr) {
    return arr.toSorted(caseInsensitiveCompare);
}
exports.caseInsensitiveAlphabetization = caseInsensitiveAlphabetization;
function caseInsensitiveCompare(str1, str2) {
    return str1.localeCompare(str2, undefined, { sensitivity: 'base' });
}
exports.caseInsensitiveCompare = caseInsensitiveCompare;
function hasTrailingWhitespace(str) {
    return str.trim() !== str;
}
exports.hasTrailingWhitespace = hasTrailingWhitespace;
function isCaseInsensitiveEqual(str1, str2) {
    return caseInsensitiveCompare(str1, str2) === 0;
}
exports.isCaseInsensitiveEqual = isCaseInsensitiveEqual;
function removeCaseInsensitiveDuplicatesFromSortedArray(sortedArray) {
    let i = 0;
    while (i < sortedArray.length - 1) {
        if (!caseInsensitiveCompare(sortedArray[i], sortedArray[i + 1])) {
            sortedArray.splice(i + 1, 1);
        }
        else {
            i++;
        }
    }
    return sortedArray;
}
exports.removeCaseInsensitiveDuplicatesFromSortedArray = removeCaseInsensitiveDuplicatesFromSortedArray;
