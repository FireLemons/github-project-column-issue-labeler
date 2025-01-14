import { ProjectPrimaryKeyHumanReadable } from './githubObjects'
import * as TypeChecker from './typeChecker'

export interface Column {
  name: string
  labelingRules: Map<LabelingAction, string[]>
}

export enum LabelingAction {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  SET = 'SET'
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
  

export interface LabelingRulePOJO {
  action: LabelingAction
  labels: string[]
}

export interface Project {
  columns: Column[]
  projectKey: ProjectPrimaryKeyHumanReadable
}

export function isShallowColumnPOJO (value: any): value is Column {
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

export function isShallowLabelingRule (value: any): value is LabelingRulePOJO {
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

/*export class Config {
  #accessToken: string
  repo: {
    name: string
    ownerName: string
  }
  columns?: Column[]
  projects?: Project[]

  constructor (configPOJO: string) {
    
  }

  isProjectMode (): boolean {
    throw new Error('unimplimented')
  }

  toString (prettyPrint: boolean): string {
    throw new Error('unimplimented')
  }
}*/
