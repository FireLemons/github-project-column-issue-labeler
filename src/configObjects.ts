import * as TypeChecker from './typeChecker'

export interface Column {
  name: string
  labelingRules: LabelingRule[]
}

export interface Config {
  accessToken: string
  repo: {
    name: string
    ownerName: string
  }
  columns?: Column[]
  projects?: Project[]
}

export enum LabelingAction {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  SET = 'SET'
}

export interface LabelingRule {
  action: LabelingAction
  labels: string[]
}

export interface Project {
  columns: Column[]
  number?: number
  ownerLogin: string
}

export function isShallowColumn (value: any): value is Column {
  if (!(TypeChecker.isObject(value))) {
    return false
  }

  try {
    TypeChecker.validateObjectMember(value, 'name', TypeChecker.Type.string)
    TypeChecker.validateObjectMember(value, 'labelingRules', TypeChecker.Type.array)
  } catch {
    return false
  }

  return true
}

export function isShallowLabelingRule (value: any): value is LabelingRule {
  if (!(TypeChecker.isObject(value))) {
    return false
  }

  try {
    TypeChecker.validateObjectMember(value, 'action', TypeChecker.Type.string)

    if (!(Object.values(LabelingAction).includes(value.action))) {
      return false
    }

    TypeChecker.validateObjectMember(value, 'labels', TypeChecker.Type.array)
  } catch {
    return false
  }

  return true
}
