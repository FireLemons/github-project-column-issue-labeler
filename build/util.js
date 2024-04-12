"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCaseInsensitiveDuplicates = exports.isCaseInsensitiveEqual = exports.caseInsensitiveSort = exports.caseInsensitiveCompare = void 0;
function caseInsensitiveCompare(str1, str2) {
    return str1.localeCompare(str2, undefined, { sensitivity: 'base' });
}
exports.caseInsensitiveCompare = caseInsensitiveCompare;
function caseInsensitiveSort(arr) {
    return arr.toSorted(caseInsensitiveCompare);
}
exports.caseInsensitiveSort = caseInsensitiveSort;
function isCaseInsensitiveEqual(str1, str2) {
    return caseInsensitiveCompare(str1, str2) === 0;
}
exports.isCaseInsensitiveEqual = isCaseInsensitiveEqual;
function removeCaseInsensitiveDuplicates(sortedArray) {
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
exports.removeCaseInsensitiveDuplicates = removeCaseInsensitiveDuplicates;
