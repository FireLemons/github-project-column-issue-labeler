"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLPage = void 0;
const TypeChecker = __importStar(require("./typeChecker"));
function isGraphQLPage(object) {
    if (!(TypeChecker.isObject(object))) {
        return false;
    }
    try {
        TypeChecker.validateObjectMember(object, 'edges', TypeChecker.Type.array);
        TypeChecker.validateObjectMember(object, 'pageInfo', TypeChecker.Type.object);
        TypeChecker.validateObjectMember(object['pageInfo'], 'hasNextPage', TypeChecker.Type.boolean);
    }
    catch (error) {
        return false;
    }
    for (const edge of object['edges']) {
        try {
            TypeChecker.validateObjectMember(edge, 'node', TypeChecker.Type.object);
            TypeChecker.validateObjectMember(edge, 'cursor', TypeChecker.Type.string);
        }
        catch (error) {
            return false;
        }
    }
    return true;
}
class GraphQLPage {
    pageData;
    constructor(pageObject) {
        if (!(isGraphQLPage(pageObject))) {
            throw new TypeError('Param pageObject is not an instance of a GraphQLPage');
        }
        this.pageData = pageObject;
    }
    appendPage(page) {
        this.pageData.edges.push(...page.getEdges());
        this.pageData.pageInfo = page.pageInfo;
    }
    getEdges() {
        return this.pageData.edges;
    }
    getLastEdgeCursor() {
        const issues = this.pageData.edges;
        if (!issues.length) {
            return null;
        }
        return issues[issues.length - 1].cursor;
    }
    getPageData() {
        return this.pageData.edges.map(edge => edge.node);
    }
    isLastPage() {
        return !(this.pageData.pageInfo.hasNextPage);
    }
}
exports.GraphQLPage = GraphQLPage;
