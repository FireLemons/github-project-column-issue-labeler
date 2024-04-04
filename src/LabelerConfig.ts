export interface ColumnConfiguration {
  columnName: string
  labelingRules: LabelingRule[]
}

export interface Config {
  'access-token': string
  owner: string
  repo: string
  columnLabelConfig: ColumnConfiguration []
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