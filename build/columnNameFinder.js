"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const githubObjects_1 = require("./githubObjects");
class ColumnNameFinder {
    #cachedSearchResults;
    #githubAPIClient;
    #hasDisabledSearchSpace;
    #hasExpandedSearchSpace;
    #issue;
    #remoteSearchSpaceParameterQueue;
    constructor(githubAPIClient, issue) {
        this.#cachedSearchResults = new Map();
        this.#hasDisabledSearchSpace = false;
        this.#hasExpandedSearchSpace = false;
        this.#githubAPIClient = githubAPIClient;
        this.#issue = issue;
        this.#remoteSearchSpaceParameterQueue = [];
    }
    async findColumnNames(projectKey) {
        const cacheCheckResult = this.#findCachedResult(projectKey);
        if (cacheCheckResult !== null) {
            return cacheCheckResult;
        }
        let hasNewSearchSpace = false;
        const issue = this.#issue;
        do {
            const localColumnNameSearchResult = this.#searchLocallyForColumnName(projectKey);
            if (projectKey !== undefined) {
                this.#remoteSearchSpaceParameterQueue = [];
                return localColumnNameSearchResult;
            }
            hasNewSearchSpace = await this.#tryAddRemoteSearchSpace();
        } while (hasNewSearchSpace);
        return this.#cachedSearchResults.size === 0 ? null : this.#getAllFoundColumnNames();
    }
    hasDisabledRemoteSearchSpace() {
        return this.#hasDisabledSearchSpace;
    }
    #cacheSearchResult(projectKey, columnName) {
        this.#cachedSearchResults.set(projectKey.asStringKey(), columnName);
    }
    #findCachedResult(projectKey) {
        if (projectKey !== undefined) {
            const projectKeyCachedResult = this.#cachedSearchResults.get(projectKey.asStringKey());
            return projectKeyCachedResult === undefined ? null : [projectKeyCachedResult];
        }
        else if (!(this.#hasAdditionalRemoteSearchSpace()) && this.#cachedSearchResults.size !== 0) {
            return this.#getAllFoundColumnNames();
        }
        else {
            return null;
        }
    }
    #getAllFoundColumnNames() {
        return Array.from(this.#cachedSearchResults.values());
    }
    #hasAdditionalRemoteSearchSpace() {
        const projectItemPage = this.#issue.getProjectItemPage();
        return !(projectItemPage.isEmpty()) && projectItemPage.hasNextPage();
    }
    #searchLocallyForColumnName(projectKey) {
        const projectItemPage = this.#issue.getProjectItemPage();
        const projectItems = projectItemPage.getNodeArray();
        let i = projectItems.length - 1;
        while (i >= 0) {
            const projectItem = projectItems[i];
            const columnNameSearchResult = projectItem.findColumnName();
            if (columnNameSearchResult === null) {
                if (this.#hasExpandedSearchSpace) {
                    const fieldValuePage = projectItem.getFieldValuePage();
                    if (fieldValuePage.hasNextPage()) {
                        this.#remoteSearchSpaceParameterQueue.push({
                            parentId: projectItem.getId(),
                            localPage: fieldValuePage
                        });
                    }
                    else {
                        projectItemPage.delete(i);
                    }
                }
            }
            else {
                projectItemPage.delete(i);
                this.#cacheSearchResult(projectItem.getProjectHumanReadablePrimaryKey(), columnNameSearchResult);
                if (projectKey !== undefined && projectItem.getProjectHumanReadablePrimaryKey().equals(projectKey)) {
                    return [columnNameSearchResult];
                }
            }
            i--;
        }
        return null;
    }
    async #tryAddExpandedSearchSpace() {
        try {
            const issue = this.#issue;
            const expandedColumnNameSearchSpacePOJO = (await this.#githubAPIClient.fetchExpandedColumnNameSearchSpace(issue.getId()));
            this.#issue.getProjectItemPage().merge(new githubObjects_1.GraphQLPageMergeable(expandedColumnNameSearchSpacePOJO.node.projectItems, githubObjects_1.ProjectItem));
            this.#hasExpandedSearchSpace = true;
            return true;
        }
        catch (error) {
            this.#hasDisabledSearchSpace = true;
            this.#issue.disableColumnNameRemoteSearchSpace();
            return false;
        }
    }
    async #tryAddPage(page, parentId) {
        const PageNodeClass = page.lookupNodeClass();
        try {
            switch (PageNodeClass) {
                case githubObjects_1.FieldValue:
                    const fieldValuePagePOJO = (await this.#githubAPIClient.fetchFieldValuePage(parentId, page.getEndCursor())).node.fieldValues;
                    page.appendPage(new githubObjects_1.GraphQLPage(fieldValuePagePOJO, githubObjects_1.FieldValue));
                    break;
                case githubObjects_1.ProjectItem:
                    const projectItemPagePOJO = (await this.#githubAPIClient.fetchProjectItemPage(parentId, page.getEndCursor())).node.projectItems;
                    page.appendPage(new githubObjects_1.GraphQLPageMergeable(projectItemPagePOJO, githubObjects_1.ProjectItem));
                    break;
            }
            return true;
        }
        catch (error) {
            this.#hasDisabledSearchSpace = true;
            page.disableRemoteDataFetching();
            return false;
        }
    }
    async #tryAddRemoteSearchSpace() {
        const projectItemPage = this.#issue.getProjectItemPage();
        if (this.#hasExpandedSearchSpace) {
            let hasNewSearchSpace = false;
            const remoteSearchSpaceParameterQueue = this.#remoteSearchSpaceParameterQueue;
            if (projectItemPage.hasNextPage()) {
                remoteSearchSpaceParameterQueue.push({
                    parentId: this.#issue.getId(),
                    localPage: projectItemPage
                });
            }
            while (remoteSearchSpaceParameterQueue.length > 0) {
                const { localPage, parentId } = remoteSearchSpaceParameterQueue.pop();
                hasNewSearchSpace = hasNewSearchSpace || await this.#tryAddPage(localPage, parentId);
            }
            return hasNewSearchSpace;
        }
        else {
            return await this.#tryAddExpandedSearchSpace();
        }
    }
}
exports.default = ColumnNameFinder;
