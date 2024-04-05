export interface ColumnConfiguration {
  columnName: string
  labelingRules: LabelingRule[]
}

export interface Config {
  accessToken: string
  owner: string
  repo: string
  columns: ColumnConfiguration []
}

export enum LabelingAction {
  ADD = "ADD",
  REMOVE = "REMOVE",
  SET = "SET"
}

export interface LabelingRule {
  action: LabelingAction
  labels: string[]
}