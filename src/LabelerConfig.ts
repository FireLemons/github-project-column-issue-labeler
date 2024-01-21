export interface ColumnConfiguration {
  columnName: string
  labelingRules: LabelingRule[]
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