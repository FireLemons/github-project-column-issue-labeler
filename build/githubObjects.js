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
exports.initializeNodes = exports.ProjectItem = exports.Label = exports.Issue = exports.GraphQLPageMergeable = exports.GraphQLPage = exports.RecordWithID = exports.FieldValue = void 0;
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
class RecordWithID {
    id;
    constructor(uid) {
        this.id = uid;
    }
    getId() {
        return this.id;
    }
}
exports.RecordWithID = RecordWithID;
class GraphQLPage {
    page;
    constructor(pagePOJO, NodeClass) {
        if (!(isGraphQLPage(pagePOJO))) {
            throw new TypeError('Param pagePOJO does not match a graphQL page');
        }
        this.page = pagePOJO;
        if (NodeClass) {
            initializeNodes(NodeClass, this);
        }
    }
    appendPage(page) {
        this.page.edges.push(...page.getEdges());
        this.page.pageInfo = page.getPageInfo();
    }
    delete(index) {
        if (0 > index || index >= this.page.edges.length) {
            throw new RangeError('Param index out of range');
        }
        return this.page.edges.splice(index, 1)[0].node;
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
class GraphQLPageMergeable extends GraphQLPage {
    activeNodeFastAccessMap;
    deletedNodeIds;
    constructor(pagePOJO, NodeClass) {
        super(pagePOJO, NodeClass);
        this.activeNodeFastAccessMap = new Map();
        for (let edge of this.page.edges) {
            const { node } = edge;
            this.activeNodeFastAccessMap.set(node.getId(), edge);
        }
        this.deletedNodeIds = new Map();
    }
    delete(index) {
        if (0 > index || index >= this.page.edges.length) {
            throw new RangeError('Param index out of range');
        }
        const deletedNode = this.page.edges.splice(index, 1)[0].node;
        const deletedNodeId = deletedNode.getId();
        this.activeNodeFastAccessMap.delete(deletedNodeId);
        this.deletedNodeIds.set(deletedNodeId, null);
        return deletedNode;
    }
    merge(page) {
        if (this.isEmpty()) {
            return;
        }
        const firstNode = this.page.edges[0].node;
        if (!(firstNode instanceof RecordWithID)) {
            throw new ReferenceError('Failed to merge pages. Page to be merged does not contain nodes with ids.');
        }
    }
}
exports.GraphQLPageMergeable = GraphQLPageMergeable;
class Issue {
    issue;
    columnName;
    columnNameSearchIndicies;
    constructor(issuePOJO) {
        if (!(isIssue(issuePOJO))) {
            throw new TypeError('Param issuePOJO does not match a github issue object');
        }
        const issueState = {
            number: issuePOJO.number
        };
        try {
            issueState.labels = new GraphQLPage(issuePOJO.labels, Label);
        }
        catch (error) {
            issuePOJO.labels = undefined;
        }
        try {
            issueState.projectItems = new GraphQLPage(issuePOJO.projectItems, ProjectItem);
        }
        catch (error) {
            throw new ReferenceError(`The project item page for issue with number:${issuePOJO.number} could not be initialized`);
        }
        this.columnNameSearchIndicies = {
            lastUnsearchedProjectItemIndex: 0,
            projectItemsWithUnsearchedFieldValues: new Map()
        };
        this.issue = issueState;
    }
    findColumnName() {
        if (this.columnName) {
            return this.columnName;
        }
        const projectItems = this.issue.projectItems.getNodeArray().concat(Array.from(this.columnNameSearchIndicies.projectItemsWithUnsearchedFieldValues.values()));
        for (let i = this.columnNameSearchIndicies.lastUnsearchedProjectItemIndex; i < projectItems.length; i++) {
            const projectItem = projectItems[i];
            try {
                const columnName = projectItem.findColumnName();
                if (columnName) {
                    this.columnName = columnName;
                    return;
                }
            }
            catch (error) {
                if (error instanceof ReferenceError) {
                    this.columnNameSearchIndicies.projectItemsWithUnsearchedFieldValues.set(projectItem.id, projectItem);
                }
            }
        }
    }
    getLabels() {
        if (this.issue.labels) {
            return this.issue.labels.getNodeArray().map((label) => {
                return label.getName();
            });
        }
        return null;
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
class ProjectItem extends RecordWithID {
    columnName;
    fieldValues;
    projectName;
    constructor(projectItemPOJO) {
        if (!isProjectItem(projectItemPOJO)) {
            throw new TypeError('Param projectItemPOJO does not match a project item object');
        }
        super(projectItemPOJO.databaseId);
        try {
            this.fieldValues = new GraphQLPage(projectItemPOJO.fieldValues, FieldValue);
        }
        catch (error) {
            throw new ReferenceError(`The field value page could not be initialized`);
        }
        this.projectName = projectItemPOJO.project.title;
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
        else if (!(this.fieldValues.isLastPage())) {
            throw new ReferenceError('Failed to find column name when searching incomplete field value pages');
        }
        return null;
    }
    getProjectName() {
        return this.projectName;
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
    if (!(TypeChecker.isObject(object))) {
        return false;
    }
    try {
        TypeChecker.validateObjectMember(object, 'name', TypeChecker.Type.string);
    }
    catch (error) {
        return false;
    }
    return true;
}
function isProjectItem(object) {
    if (!(TypeChecker.isObject(object))) {
        return false;
    }
    try {
        TypeChecker.validateObjectMember(object, 'databaseId', TypeChecker.Type.number);
        TypeChecker.validateObjectMember(object, 'fieldValues', TypeChecker.Type.object);
        TypeChecker.validateObjectMember(object, 'project', TypeChecker.Type.object);
        const { project } = object;
        TypeChecker.validateObjectMember(project, 'title', TypeChecker.Type.string);
    }
    catch (error) {
        return false;
    }
    return true;
}
