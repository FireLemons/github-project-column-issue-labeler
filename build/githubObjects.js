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
exports.initializeNodes = exports.ProjectPrimaryKeyHumanReadable = exports.ProjectItem = exports.Label = exports.Issue = exports.GraphQLPageMergeable = exports.GraphQLPage = exports.RecordWithGraphQLID = exports.FieldValue = void 0;
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
class RecordWithGraphQLID {
    #id;
    constructor(uid) {
        this.#id = uid;
    }
    getId() {
        return this.#id;
    }
}
exports.RecordWithGraphQLID = RecordWithGraphQLID;
class GraphQLPage {
    nodeClass;
    page;
    constructor(pagePOJO, NodeClass) {
        if (!(isGraphQLPage(pagePOJO))) {
            throw new TypeError('Param pagePOJO does not match a graphQL page');
        }
        this.page = pagePOJO;
        this.nodeClass = NodeClass;
        if (NodeClass !== undefined) {
            initializeNodes(NodeClass, this);
        }
    }
    appendPage(page) {
        if (page.lookupNodeClass() !== this.nodeClass) {
            throw new TypeError('Node type mismatch between pages');
        }
        this.page.edges.push(...page.getEdges());
        this.page.pageInfo = page.getPageInfo();
    }
    delete(index) {
        if (0 > index || index >= this.page.edges.length) {
            throw new RangeError('Param index out of range');
        }
        return this.page.edges.splice(index, 1)[0].node;
    }
    disableRemoteDataFetching() {
        this.page.pageInfo.hasNextPage = false;
    }
    getEdges() {
        return this.page.edges;
    }
    getEndCursor() {
        return this.page.pageInfo.endCursor;
    }
    getNodeArray() {
        return this.page.edges.map(edge => edge.node);
    }
    getPageInfo() {
        return this.page.pageInfo;
    }
    hasNextPage() {
        return this.page.pageInfo.hasNextPage;
    }
    isEmpty() {
        return this.getEdges().length === 0;
    }
    lookupNodeClass() {
        return this.nodeClass;
    }
}
exports.GraphQLPage = GraphQLPage;
class GraphQLPageMergeable extends GraphQLPage {
    activeNodeFastAccessMap;
    deletedNodeIds;
    constructor(pagePOJO, NodeClass) {
        super(pagePOJO, NodeClass);
        this.activeNodeFastAccessMap = new Map();
        for (const edge of this.page.edges) {
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
        const PageToBeMergedNodeClass = page.lookupNodeClass();
        if (PageToBeMergedNodeClass !== this.nodeClass) {
            throw new TypeError('Node type mismatch between pages');
        }
        for (const edge of page.getEdges()) {
            const { node } = edge;
            const nodeId = node.getId();
            if (this.activeNodeFastAccessMap.has(nodeId)) {
                this.activeNodeFastAccessMap.get(nodeId).node = node;
            }
            else if (!(this.deletedNodeIds.has(nodeId))) {
                this.activeNodeFastAccessMap.set(nodeId, edge);
                this.page.edges.push(edge);
            }
        }
        this.page.pageInfo = page.getPageInfo();
    }
}
exports.GraphQLPageMergeable = GraphQLPageMergeable;
class Issue {
    #columnNameMap;
    #hasExpandedSearchSpace;
    #hasInaccessibleRemoteSearchSpace;
    #id;
    labels;
    #number;
    projectItems;
    constructor(issuePOJO) {
        if (!(isIssue(issuePOJO))) {
            throw new TypeError('Param issuePOJO does not match a github issue object');
        }
        try {
            this.labels = new GraphQLPage(issuePOJO.labels, Label);
        }
        catch (error) {
            // It's fine. Labels aren't required.
        }
        try {
            this.projectItems = new GraphQLPageMergeable(issuePOJO.projectItems, ProjectItem);
        }
        catch (error) {
            throw new ReferenceError(`The project item page for issue with number:${issuePOJO.number} could not be initialized`);
        }
        this.#hasExpandedSearchSpace = false;
        this.#hasInaccessibleRemoteSearchSpace = false;
        this.#number = issuePOJO.number;
        this.#id = issuePOJO.id;
        this.#columnNameMap = new Map();
    }
    disableColumnNameRemoteSearchSpace() {
        const { projectItems } = this;
        for (const projectItem of projectItems.getNodeArray()) {
            projectItem.getFieldValuePage().disableRemoteDataFetching();
        }
        projectItems.disableRemoteDataFetching();
    }
    getId() {
        return this.#id;
    }
    getLabels() {
        if (this.labels !== undefined) {
            return this.labels.getNodeArray().map((label) => {
                return label.getName();
            });
        }
        return null;
    }
    getNumber() {
        return this.#number;
    }
    getProjectItemPage() {
        return this.projectItems;
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
class ProjectItem extends RecordWithGraphQLID {
    columnName;
    #fieldValues;
    projectPrimaryKeyHumanReadable;
    constructor(projectItemPOJO) {
        if (!isProjectItem(projectItemPOJO)) {
            throw new TypeError('Param projectItemPOJO does not match a project item object');
        }
        super(projectItemPOJO.id);
        try {
            this.#fieldValues = new GraphQLPage(projectItemPOJO.fieldValues, FieldValue);
        }
        catch (error) {
            throw new ReferenceError('The field value page could not be initialized');
        }
        this.projectPrimaryKeyHumanReadable = new ProjectPrimaryKeyHumanReadable(projectItemPOJO.project.owner.login, projectItemPOJO.project.number);
    }
    findColumnName() {
        if (this.columnName !== undefined) {
            return this.columnName;
        }
        const columnNameList = this.#fieldValues.getNodeArray();
        if (columnNameList.length !== 0) {
            this.columnName = columnNameList[0].getName();
            return this.columnName;
        }
        return null;
    }
    getFieldValuePage() {
        return this.#fieldValues;
    }
    getProjectHumanReadablePrimaryKey() {
        return this.projectPrimaryKeyHumanReadable;
    }
}
exports.ProjectItem = ProjectItem;
class ProjectPrimaryKeyHumanReadable {
    #ownerName;
    #number;
    #stringKey;
    constructor(ownerName, number = 0) {
        this.#ownerName = ownerName;
        this.#number = number;
        this.#stringKey = `${ownerName} ${number}`;
    }
    asStringKey() {
        return this.#stringKey;
    }
    equals(projectKey) {
        return this.#stringKey === projectKey.asStringKey();
    }
    getName() {
        return this.#ownerName;
    }
    getNumber() {
        return this.#number;
    }
}
exports.ProjectPrimaryKeyHumanReadable = ProjectPrimaryKeyHumanReadable;
function tryInitializeNode(GithubObjectClass, graphQLEdge) {
    try {
        graphQLEdge.node = new GithubObjectClass(graphQLEdge.node);
        return true;
    }
    catch (error) {
        return false;
    }
}
function initializeNodes(GithubObjectClass, graphQLPage) {
    const edges = graphQLPage.getEdges();
    let i = edges.length - 1;
    while (i >= 0) {
        if (!tryInitializeNode(GithubObjectClass, edges[i])) {
            edges.splice(i, 1);
        }
        i--;
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
        const { pageInfo } = object;
        TypeChecker.validateObjectMember(pageInfo, 'endCursor', TypeChecker.Type.nullableString);
        TypeChecker.validateObjectMember(pageInfo, 'hasNextPage', TypeChecker.Type.boolean);
    }
    catch (error) {
        return false;
    }
    for (const edge of object.edges) {
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
        TypeChecker.validateObjectMember(object, 'id', TypeChecker.Type.string);
        TypeChecker.validateObjectMember(object, 'fieldValues', TypeChecker.Type.object);
        TypeChecker.validateObjectMember(object, 'project', TypeChecker.Type.object);
        const { project } = object;
        TypeChecker.validateObjectMember(project, 'number', TypeChecker.Type.number);
        TypeChecker.validateObjectMember(project, 'owner', TypeChecker.Type.object);
        TypeChecker.validateObjectMember(project.owner, 'login', TypeChecker.Type.string);
    }
    catch (error) {
        return false;
    }
    return true;
}
