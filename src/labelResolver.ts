import ColumnNameFinder from './columnNameFinder'
import { Config, LabelingRuleContainer } from './config'
import { GithubAPIClient } from './githubAPIClient'
import { Issue } from './githubObjects'
import { nestedMapsToObject } from './util'

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
    console.log(nestedMapsToObject(await this.#getIssueColumnNames(issue)))
  }

  async #getIssueColumnNames (issue: Issue) {
    const columnNameFinder = new ColumnNameFinder(this.#githubAPIClient, this.#isProjectMode, issue)
    const columnNameSearchResult = await columnNameFinder.findColumnNames()
    const columnNameSearchErrors = columnNameFinder.getRemoteSearchSpaceAccessErrors()

    if (columnNameSearchErrors.length > 0) {
      throw columnNameSearchErrors
    }

    console.log(`Successfully searched issue #${issue.getNumber()} for column names`)

    return columnNameSearchResult
  }

  #getMatchingLabelingRules () {
    
  }
}