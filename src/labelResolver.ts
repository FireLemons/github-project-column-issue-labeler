import ColumnNameFinder, { ColumnNameMap, ProjectColumnNameMap } from './columnNameFinder'
import { ColumnnLabelingRuleContainer, Config, LabelingAction, LabelingActionsAsMap, LabelingRuleContainer, ProjectLabelingRuleContainer } from './config'
import { ConflictError } from './errors/conflictError'
import { GithubAPIClient } from './githubAPIClient'
import { Issue } from './githubObjects'
import { hasSameCaseInsensitiveElement, nestedMapsToObject } from './util'

export default class LabelResolver {
  #githubAPIClient: GithubAPIClient
  #isProjectMode: boolean
  #labelingRules: LabelingRuleContainer

  constructor (githubAPIClient: GithubAPIClient, config: Config) {
    this.#githubAPIClient = githubAPIClient
    this.#isProjectMode = config.isProjectMode()
    this.#labelingRules = config.getLabelingRules()
  }

  async getLabelDiff (issue: Issue) {
    const columnNames = await this.#getIssueColumnNames(issue)

    console.log(`Successfully searched issue #${issue.getNumber()} for column names`)
    console.log(nestedMapsToObject(columnNames))

    const matchingLabelingRules = this.#getMatchingLabelingRules(columnNames)

    console.log(`Successfully found matching labeling rules for issue #${issue.getNumber()}`)
    console.log(nestedMapsToObject(matchingLabelingRules))
  }

  #addLabelingRuleToLabelingActionContainer (labelingAction: LabelingAction, labelingActionContainer: LabelingActionsAsMap, labels: string[]): void {
    if (labelingActionContainer.has(LabelingAction.SET) || (labelingAction === LabelingAction.SET && labelingActionContainer.size > 0)) {
      throw new ConflictError('Issue belongs to multiple columns including one with a SET rule. This was most likely not intended.')
    }

    if (labelingAction === LabelingAction.ADD && labelingActionContainer.has(LabelingAction.REMOVE)) {
      if (hasSameCaseInsensitiveElement(labels, labelingActionContainer.get(LabelingAction.REMOVE)!)) {
        throw new ConflictError('Issue was found to have the same label between and ADD and a REMOVE rule. This was most likely not intended.')
      }
    }

    if (labelingAction === LabelingAction.REMOVE && labelingActionContainer.has(LabelingAction.ADD)) {
      if (hasSameCaseInsensitiveElement(labels, labelingActionContainer.get(LabelingAction.ADD)!)) {
        throw new ConflictError('Issue was found to have the same label between and ADD and a REMOVE rule. This was most likely not intended. Skipping issue labeling.')
      }
    }

    labelingActionContainer.set(labelingAction, labels)
  }

  async #getIssueColumnNames (issue: Issue): Promise<ColumnNameMap | ProjectColumnNameMap> {
    const columnNameFinder = new ColumnNameFinder(this.#githubAPIClient, this.#isProjectMode, issue)
    const columnNameSearchResult = await columnNameFinder.findColumnNames()
    const columnNameSearchErrors = columnNameFinder.getRemoteSearchSpaceAccessErrors()

    if (columnNameSearchErrors.length > 0) {
      throw columnNameSearchErrors
    }

    return columnNameSearchResult
  }

  #getMatchingLabelingRules (columnNameMap: ColumnNameMap | ProjectColumnNameMap): LabelingActionsAsMap {
    if (this.#isProjectMode) {
      return this.#getMatchingLabelingRulesProjectMode(columnNameMap as ProjectColumnNameMap)
    } else {
      return this.#getMatchingLabelingRulesColumnMode(columnNameMap as ColumnNameMap)
    }
  }

  #getMatchingLabelingRulesColumnMode (columnNameMap: ColumnNameMap): LabelingActionsAsMap {
    const nonProjectLabelingRuleContainer: ColumnnLabelingRuleContainer = this.#labelingRules as ColumnnLabelingRuleContainer
    const matchingLabelingRules = new Map()

    for (const columnName of columnNameMap.keys()) {
      const matchingLabelingRule = nonProjectLabelingRuleContainer.get(columnName)

      if (matchingLabelingRule !== undefined) {
        for (const [labelingAction, labels] of matchingLabelingRule.entries()) {
          this.#addLabelingRuleToLabelingActionContainer(labelingAction, matchingLabelingRules, labels)
        }
      }
    }

    return matchingLabelingRules
  }

  #getMatchingLabelingRulesProjectMode (columnNameMap: ProjectColumnNameMap): LabelingActionsAsMap {
    const projectLabelingRuleContainer: ProjectLabelingRuleContainer = this.#labelingRules as ProjectLabelingRuleContainer
    const matchingLabelingRules = new Map()

    for (const [projectName, projectNumberContainer] of columnNameMap.entries()) {
      for (const [projectNumber, columnNameContainer] of projectNumberContainer.entries()) {
        for (const columnName of columnNameContainer.keys()) {
          const matchingLabelingRule = projectLabelingRuleContainer.get(projectName)?.get(projectNumber)?.get(columnName)

          if (matchingLabelingRule !== undefined) {
            for (const [labelingAction, labels] of matchingLabelingRule.entries()) {
              this.#addLabelingRuleToLabelingActionContainer(labelingAction, matchingLabelingRules, labels)
            }
          }
        }
      }
    }

    return matchingLabelingRules
  }
}
