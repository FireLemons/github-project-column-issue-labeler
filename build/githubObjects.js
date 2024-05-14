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
exports.Issue = exports.GraphQLPage = void 0;
const TypeChecker = __importStar(require("./typeChecker"));
class GraphQLPage {
    page;
    constructor(pageObject) {
        if (!(isGraphQLPage(pageObject))) {
            throw new TypeError('Param pageObject does not match a graphQL page');
        }
        this.page = pageObject;
    }
    appendPage(page) {
        this.page.edges.push(...page.#getEdges());
        this.page.pageInfo = page.getPageInfo();
    }
    getEndCursor() {
        return this.page.pageInfo.endCursor;
    }
    getNodeArray() {
        return this.page.edges.map((edge) => {
            return edge.node;
        });
    }
    getPageNodes() {
        return this.page.edges.map(edge => edge.node);
    }
    getPageInfo() {
        return this.page.pageInfo;
    }
    isEmpty() {
        return this.#getEdges().length === 0;
    }
    isLastPage() {
        return !(this.page.pageInfo.hasNextPage);
    }
    #getEdges() {
        return this.page.edges;
    }
}
exports.GraphQLPage = GraphQLPage;
class Issue {
    issue;
    constructor(issueObject) {
        if (!(isIssue(issueObject))) {
            throw new TypeError('Param issueObject does not match a github issue object');
        }
        // Init label page
        // Init projectItemPage
        this.issue = issueObject;
    }
    findColumnName() {
    }
    getId() {
        return this.issue.id;
    }
    getLabels() {
    }
    getNumber() {
        return this.issue.number;
    }
}
exports.Issue = Issue;
function isFieldValue(object) {
    try {
        TypeChecker.validateObjectMember(object, 'name', TypeChecker.Type.string);
    }
    catch (error) {
        return false;
    }
    return true;
}
function isGraphQLPage(object) {
    if (!(TypeChecker.isObject(object))) {
        return false;
    }
    try {
        TypeChecker.validateObjectMember(object, 'edges', TypeChecker.Type.array);
        TypeChecker.validateObjectMember(object, 'pageInfo', TypeChecker.Type.object);
        TypeChecker.validateObjectMember(object['pageInfo'], 'endCursor', TypeChecker.Type.string);
        TypeChecker.validateObjectMember(object['pageInfo'], 'hasNextPage', TypeChecker.Type.boolean);
    }
    catch (error) {
        return false;
    }
    for (const edge of object['edges']) {
        try {
            TypeChecker.validateObjectMember(edge, 'node', TypeChecker.Type.object);
        }
        catch (error) {
            return false;
        }
    }
    return true;
}
function isIssue(object) {
    if (!(TypeChecker.isObject(object))) {
        return false;
    }
    try {
        TypeChecker.validateObjectMember(object, 'id', TypeChecker.Type.string);
        TypeChecker.validateObjectMember(object, 'number', TypeChecker.Type.number);
        TypeChecker.validateObjectMember(object, 'labels', TypeChecker.Type.object);
        TypeChecker.validateObjectMember(object, 'projectItems', TypeChecker.Type.object);
    }
    catch (error) {
        return false;
    }
    if (!(isGraphQLPage(object.labels) && isGraphQLPage(object.projectItems))) {
        return false;
    }
    return true;
}
function isLabel(object) {
    try {
        TypeChecker.validateObjectMember(object, 'name', TypeChecker.Type.string);
    }
    catch (error) {
        return false;
    }
    return true;
}
function isProjectItem(object) {
    try {
        TypeChecker.validateObjectMember(object, 'fieldValues', TypeChecker.Type.object);
    }
    catch (error) {
        return false;
    }
    return isGraphQLPage(object.fieldValues);
}
