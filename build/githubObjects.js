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
exports.initializeNodes = exports.ProjectItem = exports.Label = exports.Issue = exports.GraphQLPage = exports.FieldValue = void 0;
const TypeChecker = __importStar(require("./typeChecker"));
class FieldValue {
    name; // Column Name
    constructor(fieldValuePOJO) {
        if (!isFieldValue(fieldValuePOJO)) {
            throw new TypeError('Param fieldValuePOJO does not match a field value object');
        }
        this.name = fieldValuePOJO.name;
    }
    getName() {
        return this.name;
    }
}
exports.FieldValue = FieldValue;
class GraphQLPage {
    page;
    constructor(pagePOJO) {
        if (!(isGraphQLPage(pagePOJO))) {
            throw new TypeError('Param pagePOJO does not match a graphQL page');
        }
        this.page = pagePOJO;
    }
    appendPage(page) {
        this.page.edges.push(...page.getEdges());
        this.page.pageInfo = page.getPageInfo();
    }
    getEdges() {
        return this.page.edges;
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
        return this.getEdges().length === 0;
    }
    isLastPage() {
        return !(this.page.pageInfo.hasNextPage);
    }
}
exports.GraphQLPage = GraphQLPage;
class Issue {
    issue;
    constructor(issuePOJO) {
        if (!(isIssue(issuePOJO))) {
            throw new TypeError('Param issuePOJO does not match a github issue object');
        }
        try {
            issuePOJO.labels = new GraphQLPage(issuePOJO.labels);
            initializeNodes(Label, issuePOJO.labels);
        }
        catch (error) {
            issuePOJO.labels = undefined;
        }
        try {
            issuePOJO.projectItems = new GraphQLPage(issuePOJO.projectItems);
            initializeNodes(ProjectItem, issuePOJO.projectItems);
        }
        catch (error) {
            throw new ReferenceError(`The project item page for issue with number:${issuePOJO.number} could not be initialized`);
        }
        this.issue = issuePOJO;
    }
    findColumnName() {
    }
    getLabels() {
    }
    getNumber() {
        return this.issue.number;
    }
}
exports.Issue = Issue;
class Label {
    name;
    constructor(labelPOJO) {
        if (!isLabel(labelPOJO)) {
            throw new TypeError('Param labelPOJO does not match a label object');
        }
        this.name = labelPOJO.name;
    }
    getName() {
        return this.name;
    }
}
exports.Label = Label;
class ProjectItem {
    columnName;
    fieldValues;
    constructor(projectItemPOJO) {
        if (!isProjectItem(projectItemPOJO)) {
            TypeError('Param projectItemPOJO does not match a project item object');
        }
        try {
            projectItemPOJO.fieldValues = new GraphQLPage(projectItemPOJO.fieldValues);
            initializeNodes(FieldValue, projectItemPOJO.projectItemPage);
        }
        catch (error) {
            throw new ReferenceError(`The field value page could not be initialized`);
        }
        this.fieldValues = projectItemPOJO.fieldValues;
    }
    findColumnName() {
        if (this.columnName) {
            return this.columnName;
        }
        const columnNameList = this.fieldValues.getNodeArray();
        if (columnNameList.length) {
            this.columnName = columnNameList[0].getName();
            return this.columnName;
        }
        else if (this.fieldValues.isLastPage()) {
            throw new ReferenceError('Failed to find column name when searching incomplete field value pages');
        }
        return null;
    }
}
exports.ProjectItem = ProjectItem;
function initializeNodes(GithubObjectClass, graphQLPage) {
    let i = 0;
    const edges = graphQLPage.getEdges();
    while (i < edges.length) {
        try {
            edges[i] = {
                node: new GithubObjectClass(edges[i].node)
            };
            i++;
        }
        catch (error) {
            edges.splice(i, 1);
        }
    }
}
exports.initializeNodes = initializeNodes;
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
        TypeChecker.validateObjectMember(object, 'number', TypeChecker.Type.number);
        TypeChecker.validateObjectMember(object, 'labels', TypeChecker.Type.object);
        TypeChecker.validateObjectMember(object, 'projectItems', TypeChecker.Type.object);
    }
    catch (error) {
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
    return true;
}
