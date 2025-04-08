import ConfigTestData from './data/configTestData'
import { Config, LabelingAction, ProjectLabelingRuleContainer } from '../src/config'
import { Logger } from '../src/logger'
import * as TypeChecker from '../src/typeChecker'
import { caseInsensitiveCompare, firstKeyValuePairOfMap } from '../src/util'

interface ConfigPOJO {
  accessToken: string
  repo: {
    name: string
    ownerName: string
  }
  columns?: {
    name: string
    labelingActions: {
      action: string
      labels: string[]
    }[]
  }[]
  projects?: {
    columns: {
      name: string
      labelingActions: {
        action: string
        labels: string[]
      }[]
    }[]
    number: number
    ownerLogin: string
  }[]
}

const logger = new Logger()

function stringArrayToLowercase (strings: string[]) {
  const lowercaseStrings = []

  for (let i = 0; i < strings.length; i++) {
    lowercaseStrings.push(strings[i].toLocaleLowerCase())
  }

  return lowercaseStrings
}

const consoleLoggingFunctionSpies: { [name: string]: jest.SpiedFunction<typeof console.warn> } = {
  info: jest.spyOn(console, 'info'),
  warn: jest.spyOn(console, 'warn'),
  error: jest.spyOn(console, 'error')
}

function resetSpies () {
  for (const consoleLoggingFunctionName in consoleLoggingFunctionSpies) {
    consoleLoggingFunctionSpies[consoleLoggingFunctionName].mockReset()
  }
}

// Prevents all the logger calls from printing
resetSpies()

describe('Config', () => {
  describe('constructor', () => {
    describe('fatally invalid values', () => {
      describe('when config contains invalid json', () => {
        it('throws an error', () => {
          expect(() => {
            new Config(ConfigTestData.invalidJSON, logger)
          }).toThrow(SyntaxError)
        })
      })

      describe('when config is missing a required key', () => {
        it('throws a reference error with a message describing which key is missing', () => {
          const initConfig = () => {
            new Config(ConfigTestData.configMissingKey, logger)
          }

          expect(initConfig).toThrow(ReferenceError)
          expect(initConfig).toThrow('key "accessToken" was not found in the object')
        })
      })

      describe('when the github access token is of the wrong type', () => {
        it('throws an error with a message describing the problem', () => {
          const initConfig = () => {
            new Config(ConfigTestData.configWrongTypeAccessToken, logger)
          }

          expect(initConfig).toThrow(TypeError)
          expect(initConfig).toThrow('Member "accessToken" was found not to be a string')
        })
      })

      describe('when the github access token contains only whitespace', () => {
        it('throws an error with a message describing the problem', () => {
          const initConfig = () => {
            new Config(ConfigTestData.configWhiteSpaceOnlyAccessToken, logger)
          }

          expect(initConfig).toThrow(RangeError)
          expect(initConfig).toThrow('The github access token cannot be empty or contain only whitespace')
        })
      })

      describe('when the labeling rule container is set as projects', () => {
        describe('when projects is not an array', () => {
          it('throws an error with a message describing the problem', () => {
            const initConfig = () => {
              new Config(ConfigTestData.configWrongTypeProjects, logger)
            }

            expect(initConfig).toThrow(TypeError)
            expect(initConfig).toThrow('Member "projects" was found not to be an array')
          })
        })

        describe('when all projects are invalid', () => {
          it('throws an error with a message describing that there are no valid projects', () => {
            const initConfig = () => {
              new Config(ConfigTestData.projectOnlyInvalidValues, logger)
            }

            expect(initConfig).toThrow(Error)
            expect(initConfig).toThrow('The labeling rule container did not contain any valid rules')
          })
        })
      })

      describe('when the labeling rule container is set as columns', () => {
        describe('when columns is not an array', () => {
          it('throws an error with a message describing the problem', () => {
            const initConfig = () => {
              new Config(ConfigTestData.configWrongTypeColumns, logger)
            }

            expect(initConfig).toThrow(TypeError)
            expect(initConfig).toThrow('Member "columns" was found not to be an array')
          })
        })

        describe('when all columns are invalid', () => {
          it('throws an error with a message describing the problem', () => {
            const initConfig = () => {
              new Config(ConfigTestData.columnOnlyInvalidValues, logger)
            }

            expect(initConfig).toThrow(Error)
            expect(initConfig).toThrow('The labeling rule container did not contain any valid rules')
          })
        })
      })

      describe('repo', () => {
        describe('when the repo is of the wrong type', () => {
          it('throws an error with a message describing the problem', () => {
            const initConfig = () => {
              new Config(ConfigTestData.configWrongTypeRepo, logger)
            }

            expect(initConfig).toThrow(TypeError)
            expect(initConfig).toThrow('Member "repo" was found not to be an object')
          })
        })

        describe('when the repo owner is not a string', () => {
          it('throws an error with a message describing the problem', () => {
            const initConfig = () => {
              new Config(ConfigTestData.repoWrongTypeOwnerName, logger)
            }

            expect(initConfig).toThrow(TypeError)
            expect(initConfig).toThrow('Member "ownerName" was found not to be a string')
          })
        })

        describe('when the repo owner contains only whitespace', () => {
          it('throws an error with a message describing the problem', () => {
            const initConfig = () => {
              new Config(ConfigTestData.repoWhitespaceOnlyOwnerName, logger)
            }

            expect(initConfig).toThrow(RangeError)
            expect(initConfig).toThrow('ownerName must contain at least one non whitespace character')
          })
        })

        describe('when the repo name is not a string', () => {
          it('throws an error with a message describing the problem', () => {
            const initConfig = () => {
              new Config(ConfigTestData.repoWrongTypeName, logger)
            }

            expect(initConfig).toThrow(TypeError)
            expect(initConfig).toThrow('Member "name" was found not to be a string') // TODO message not specific enough
          })
        })

        describe('when the repo name contains only whitespace', () => {
          it('throws an error with a message describing the problem', () => {
            const initConfig = () => {
              new Config(ConfigTestData.repoWhitespaceOnlyName, logger)
            }

            expect(initConfig).toThrow(RangeError)
            expect(initConfig).toThrow('name must contain at least one non whitespace character') // TODO message not specific enough
          })
        })
      })
    })
  })

  describe('nonfatal invalid values', () => {
    let config: Config
    let consoleInfoCalls: [message?: any, ...optionalParams: any[]][]
    let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]

    beforeAll(() => {
      resetSpies()

      config = new Config(ConfigTestData.configInvalidNonEssentialSections, logger)

      consoleInfoCalls = consoleLoggingFunctionSpies.info.mock.calls
      consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
    })

    describe('columns', () => {
      const testInvalidColumnEliminationWarningsFromFirstValidationPass = (warning: RegExp, headerIndex: number, isLast?: boolean) => {
        let validityExplanationWarningIndex: number

        beforeAll(() => {
          validityExplanationWarningIndex = consoleWarnCalls.findIndex((warningCall) => {
            return warning.test(warningCall[0])
          })
        })

        it('prints a warning explaining why the column is invalid and what will be done about it', () => {
          expect(validityExplanationWarningIndex!).not.toBe(-1)
          expect(consoleWarnCalls[validityExplanationWarningIndex! - 1][0]).toMatch(/Could not make valid column\. Skipping column\./)
        })

        it('prints the warnings under the correct header', () => {
          const headerCallIndex = consoleInfoCalls.findIndex((infoCall) => {
            return new RegExp(`Validating column at index ${headerIndex}`).test(infoCall[0])
          })
          const nextHeaderCallIndex = consoleInfoCalls.findIndex((infoCall) => {
            return new RegExp(`Validating column at index ${headerIndex + 1}`).test(infoCall[0])
          })
          const loggerInfoInvocationOrderRecords = consoleLoggingFunctionSpies.info.mock.invocationCallOrder
          const loggerWarnInvocationOrderRecords = consoleLoggingFunctionSpies.warn.mock.invocationCallOrder

          expect(headerCallIndex).not.toBe(-1)
          expect(loggerInfoInvocationOrderRecords[headerCallIndex]).toBeLessThan(loggerWarnInvocationOrderRecords[validityExplanationWarningIndex])
          if (isLast !== true) {
            expect(nextHeaderCallIndex).not.toBe(-1)
            expect(loggerWarnInvocationOrderRecords[validityExplanationWarningIndex]).toBeLessThan(loggerInfoInvocationOrderRecords[nextHeaderCallIndex])
          }
        })
      }

      describe('when the column is not an object', () => {
        testInvalidColumnEliminationWarningsFromFirstValidationPass(/Column must be an object/, 0)
      })

      describe('when the column has only whitespace for its name', () => {
        testInvalidColumnEliminationWarningsFromFirstValidationPass(/name must contain at least one non whitespace character/, 1)
      })

      describe('when the column contains only invalid labeling actions', () => {
        let validityExplanationWarning: string | undefined

        beforeAll(() => {
          validityExplanationWarning = consoleWarnCalls.find((warningCall) => {
            return /Column.*did not contain any valid labeling actions\./.test(warningCall[0])
          })?.at(0)
        })

        it('prints a warning explaining why the column is invalid', () => {
          expect(validityExplanationWarning!).not.toBe(undefined)
        })

        it('includes what will be done about the invalid column in the warning', () => {
          expect(validityExplanationWarning!).toContain('Removing column')
        })

        it('includes identifying information about the column in the warning', () => {
          expect(validityExplanationWarning!).toContain('name:"column name"')
        })
      })

      describe('when the column is missing the "labelingActions" key', () => {
        testInvalidColumnEliminationWarningsFromFirstValidationPass(/key "labelingActions" was not found in the object/, 3)
      })

      describe('when the column is missing the "name" key', () => {
        testInvalidColumnEliminationWarningsFromFirstValidationPass(/key "name" was not found in the object/, 4)
      })

      describe('when the "labelingActions" key does not map to an array', () => {
        testInvalidColumnEliminationWarningsFromFirstValidationPass(/Member "labelingActions" was found not to be an array/, 5)
      })

      describe('when the "name" key does not map to a string', () => {
        testInvalidColumnEliminationWarningsFromFirstValidationPass(/Member "name" was found not to be a string/, 6, true)
      })

      it('keeps only the valid column', () => {
        const validatedLabelingRules: ProjectLabelingRuleContainer = config.getLabelingRules() as ProjectLabelingRuleContainer

        // Prove the labeling rule container has only one column
        expect(validatedLabelingRules.size).toBe(1)
        const projectNumberMap = firstKeyValuePairOfMap(validatedLabelingRules)!.value
        expect(projectNumberMap.size).toBe(1)
        const columnMap = firstKeyValuePairOfMap(projectNumberMap)!.value
        expect(columnMap.size).toBe(1)

        // Prove the remaining column is the valid column
        expect(columnMap.has('valid column')).toBe(true)
      })
    })

    describe('labeling actions', () => {
      const testInvalidLabelingActionEliminationWarningsFromFirstValidationPass = (warning: RegExp, headerIndex: number, isLast?: boolean) => {
        let validityExplanationWarningIndex: number

        beforeAll(() => {
          validityExplanationWarningIndex = consoleWarnCalls.findIndex((warningCall) => {
            return warning.test(warningCall[0])
          })
        })

        it('prints a warning explaining why the labeling action is invalid and what will be done about it', () => {
          expect(validityExplanationWarningIndex!).not.toBe(-1)
          expect(consoleWarnCalls[validityExplanationWarningIndex! - 1][0]).toMatch(/Could not make valid labeling action\. Skipping action\./)
        })

        it('prints the warnings under the correct header', () => {
          const headerCallIndex = consoleInfoCalls.findIndex((infoCall) => {
            return new RegExp(`Validating labeling action at index ${headerIndex}`).test(infoCall[0])
          })
          const nextHeaderCallIndex = consoleInfoCalls.findIndex((infoCall) => {
            return new RegExp(`Validating labeling action at index ${headerIndex + 1}`).test(infoCall[0])
          })
          const loggerInfoInvocationOrderRecords = consoleLoggingFunctionSpies.info.mock.invocationCallOrder
          const loggerWarnInvocationOrderRecords = consoleLoggingFunctionSpies.warn.mock.invocationCallOrder

          expect(headerCallIndex).not.toBe(-1)
          expect(loggerInfoInvocationOrderRecords[headerCallIndex]).toBeLessThan(loggerWarnInvocationOrderRecords[validityExplanationWarningIndex])
          if (isLast !== true) {
            expect(nextHeaderCallIndex).not.toBe(-1)
            expect(loggerWarnInvocationOrderRecords[validityExplanationWarningIndex]).toBeLessThan(loggerInfoInvocationOrderRecords[nextHeaderCallIndex])
          }
        })
      }

      describe('when the labeling action is not an object', () => {
        testInvalidLabelingActionEliminationWarningsFromFirstValidationPass(/Labeling action must be an object/, 0)
      })

      describe('when the labeling action does not contain any valid labels', () => {
        let validityExplanationWarningIndex: number

        beforeAll(() => {
          validityExplanationWarningIndex = consoleWarnCalls.findIndex((warningCall) => {
            return /Labeling action did not contain any valid labels. Skipping action./.test(warningCall[0])
          })
        })

        it('prints a warning explaining why the labeling action is invalid and what will be done about it', () => {
          expect(validityExplanationWarningIndex!).not.toBe(-1)
        })

        it('prints the warning under the correct header', () => {
          const headerCallIndex = consoleInfoCalls.findIndex((infoCall) => {
            return /Validating labeling action at index 1/.test(infoCall[0])
          })
          const nextHeaderCallIndex = consoleInfoCalls.findIndex((infoCall) => {
            return /Validating labeling action at index 2/.test(infoCall[0])
          })
          const loggerInfoInvocationOrderRecords = consoleLoggingFunctionSpies.info.mock.invocationCallOrder
          const loggerWarnInvocationOrderRecords = consoleLoggingFunctionSpies.warn.mock.invocationCallOrder

          expect(headerCallIndex).not.toBe(-1)
          expect(loggerInfoInvocationOrderRecords[headerCallIndex]).toBeLessThan(loggerWarnInvocationOrderRecords[validityExplanationWarningIndex])
          expect(nextHeaderCallIndex).not.toBe(-1)
          expect(loggerWarnInvocationOrderRecords[validityExplanationWarningIndex]).toBeLessThan(loggerInfoInvocationOrderRecords[nextHeaderCallIndex])
        })
      })

      describe('when the labeling action is missing the "action" key', () => {
        testInvalidLabelingActionEliminationWarningsFromFirstValidationPass(/key "action" was not found in the object/, 2)
      })

      describe('when the labeling action is missing the "labels" key', () => {
        testInvalidLabelingActionEliminationWarningsFromFirstValidationPass(/key "labels" was not found in the object/, 3)
      })

      describe('when labeling actions have all of their labels conflict', () => {
        let validityExplanationWarningA: string | undefined
        let validityExplanationWarningB: string | undefined

        beforeAll(() => {
          validityExplanationWarningA = consoleWarnCalls.find((warningCall) => {
            return /Labeling action:"ADD" .* did not contain any valid labels/.test(warningCall[0])
          })?.at(0)
          validityExplanationWarningB = consoleWarnCalls.find((warningCall) => {
            return /Labeling action:"REMOVE" .* did not contain any valid labels/.test(warningCall[0])
          })?.at(0)
        })

        it('prints a warning explaining why the labeling action is invalid', () => {
          expect(validityExplanationWarningA!).not.toBe(undefined)
          expect(validityExplanationWarningB!).not.toBe(undefined)
        })

        it('includes what will be done about the invalid labeling action in the warning', () => {
          expect(validityExplanationWarningA!).toContain('Removing action')
          expect(validityExplanationWarningB!).toContain('Removing action')
        })

        it('includes identifying information about the parent column in the warning', () => {
          expect(validityExplanationWarningA!).toContain('from column with name:"column name"')
          expect(validityExplanationWarningA!).toContain('from column with name:"column name"')
        })
      })

      describe('when the labeling action has an action that is not supported', () => {
        testInvalidLabelingActionEliminationWarningsFromFirstValidationPass(/Labeling action ".+" is not supported\. Supported actions are: \["ADD","REMOVE","SET"\]/, 6)
      })

      describe('when the "action" key does not map to a string', () => {
        testInvalidLabelingActionEliminationWarningsFromFirstValidationPass(/Member "action" was found not to be a string/, 7)
      })

      describe('when the "labels" key does not map to an array', () => {
        testInvalidLabelingActionEliminationWarningsFromFirstValidationPass(/Member "labels" was found not to be an array/, 8, true)
      })
    })

    describe('labels', () => {
      const parentLabelingActionIndex = 1
      const testInvalidLabelEliminationWarningsFromFirstValidationPass = (warning: RegExp, labelIndex: number) => {
        let validityExplanationWarningIndex: number

        beforeAll(() => {
          validityExplanationWarningIndex = consoleWarnCalls.findIndex((warningCall) => {
            return warning.test(warningCall[0])
          })
        })

        it('prints a warning explaining why the label is invalid', () => {
          expect(validityExplanationWarningIndex!).not.toBe(-1)
        })

        it('includes the index of the invalid label', () => {
          expect(consoleWarnCalls[validityExplanationWarningIndex][0]!).toContain(`at index: ${labelIndex}`)
        })

        it('includes what will be done about the invalid label in the warning', () => {
          expect(consoleWarnCalls[validityExplanationWarningIndex][0]!).toContain('Removing label.')
        })

        it('prints the warnings under the correct header', () => {
          const headerCallIndex = consoleInfoCalls.findIndex((infoCall) => {
            return new RegExp(`Validating labeling action at index ${parentLabelingActionIndex}`).test(infoCall[0])
          })
          const nextHeaderCallIndex = consoleInfoCalls.findIndex((infoCall) => {
            return new RegExp(`Validating labeling action at index ${parentLabelingActionIndex + 1}`).test(infoCall[0])
          })
          const loggerInfoInvocationOrderRecords = consoleLoggingFunctionSpies.info.mock.invocationCallOrder
          const loggerWarnInvocationOrderRecords = consoleLoggingFunctionSpies.warn.mock.invocationCallOrder

          expect(headerCallIndex).not.toBe(-1)
          expect(loggerInfoInvocationOrderRecords[headerCallIndex]).toBeLessThan(loggerWarnInvocationOrderRecords[validityExplanationWarningIndex])
          expect(loggerWarnInvocationOrderRecords[validityExplanationWarningIndex]).toBeLessThan(loggerInfoInvocationOrderRecords[nextHeaderCallIndex])
        })
      }

      describe('when the label contains only whitespace', () => {
        testInvalidLabelEliminationWarningsFromFirstValidationPass(/Label .* must contain at least one non whitespace character/, 0)
      })

      describe('when the label is not a sting', () => {
        testInvalidLabelEliminationWarningsFromFirstValidationPass(/Label .* was found not to be a string/, 1)
      })
    })

    describe('projects', () => {
      const testInvalidProjectEliminationWarningsFromFirstValidationPass = (warning: RegExp, headerIndex: number) => {
        let validityExplanationWarningIndex: number

        beforeAll(() => {
          validityExplanationWarningIndex = consoleWarnCalls.findIndex((warningCall) => {
            return warning.test(warningCall[0])
          })
        })

        it('prints a warning explaining why the project is invalid and what will be done about it', () => {
          expect(validityExplanationWarningIndex!).not.toBe(-1)
          expect(consoleWarnCalls[validityExplanationWarningIndex! - 1][0]).toMatch(/Could not make valid project\. Skipping project\./)
        })

        it('prints the warnings under the correct header', () => {
          const headerCallIndex = consoleInfoCalls.findIndex((infoCall) => {
            return new RegExp(`Validating project at index ${headerIndex}`).test(infoCall[0])
          })
          const nextHeaderCallIndex = consoleInfoCalls.findIndex((infoCall) => {
            return new RegExp(`Validating project at index ${headerIndex + 1}`).test(infoCall[0])
          })
          const loggerInfoInvocationOrderRecords = consoleLoggingFunctionSpies.info.mock.invocationCallOrder
          const loggerWarnInvocationOrderRecords = consoleLoggingFunctionSpies.warn.mock.invocationCallOrder

          expect(headerCallIndex).not.toBe(-1)
          expect(nextHeaderCallIndex).not.toBe(-1)
          expect(loggerInfoInvocationOrderRecords[headerCallIndex]).toBeLessThan(loggerWarnInvocationOrderRecords[validityExplanationWarningIndex])
          expect(loggerWarnInvocationOrderRecords[validityExplanationWarningIndex]).toBeLessThan(loggerInfoInvocationOrderRecords[nextHeaderCallIndex])
        })
      }

      describe('when the project is not an object', () => {
        testInvalidProjectEliminationWarningsFromFirstValidationPass(/A project must be an object/, 0)
      })

      describe('when the project has only whitespace for its owner login', () => {
        testInvalidProjectEliminationWarningsFromFirstValidationPass(/ownerLogin must contain at least one non whitespace character/, 1)
      })

      describe('when the project contains only invalid columns', () => {
        let validityExplanationWarning: string | undefined

        beforeAll(() => {
          validityExplanationWarning = consoleWarnCalls.find((warningCall) => {
            return /Project.*did not contain any valid columns\./.test(warningCall[0])
          })?.at(0)
        })

        it('prints a warning explaining why the project is invalid', () => {
          expect(validityExplanationWarning!).not.toBe(undefined)
        })

        it('includes what will be done about the invalid project in the warning', () => {
          expect(validityExplanationWarning!).toContain('Removing project')
        })

        it('includes identifying information about the project in the warning', () => {
          expect(validityExplanationWarning!).toContain('name:"owner name"')
          expect(validityExplanationWarning!).toContain('number:1')
        })
      })

      describe('when the project is missing the "columns" key', () => {
        testInvalidProjectEliminationWarningsFromFirstValidationPass(/key "columns" was not found in the object/, 3)
      })

      describe('when the project is missing the "ownerLogin" key', () => {
        testInvalidProjectEliminationWarningsFromFirstValidationPass(/key "ownerLogin" was not found in the object/, 4)
      })

      describe('when the project number is less than 1', () => {
        testInvalidProjectEliminationWarningsFromFirstValidationPass(/number must be greater than 0/, 5)
      })

      describe('when the "columns" key does not map to an array', () => {
        testInvalidProjectEliminationWarningsFromFirstValidationPass(/Member "columns" was found not to be an array/, 6)
      })

      describe('when the "number" key does not map to a number', () => {
        testInvalidProjectEliminationWarningsFromFirstValidationPass(/number must be an integer/, 7)
      })

      describe('when the "ownerLogin" key does not map to a string', () => {
        testInvalidProjectEliminationWarningsFromFirstValidationPass(/Member "ownerLogin" was found not to be a string/, 8)
      })

      it('keeps only the valid project', () => {
        const validatedLabelingRules: ProjectLabelingRuleContainer = config.getLabelingRules() as ProjectLabelingRuleContainer

        expect(validatedLabelingRules.size).toBe(1)
        expect(validatedLabelingRules.get('valid project')?.has(0)).toBe(true)
      })
    })
  })

  describe('getLabelingRules()', () => {
    describe('the container structure', () => {
      it('is a column name map with child labeling action maps with label array values when the config initialized with a json using columns', () => {
        const config = new Config(ConfigTestData.columnMinimal, logger)
        const labelingRules = config.getLabelingRules()

        expect(labelingRules).toBeInstanceOf(Map)

        for (const [key, value] of labelingRules.entries()) {
          expect(TypeChecker.isString(key)).toBe(true)
          expect(value).toBeInstanceOf(Map)

          for (const [childMapKey, childMapValue] of value) {
            expect(childMapKey in LabelingAction).toBe(true)
            expect(Array.isArray(childMapValue)).toBe(true)
          }
        }
      })

      it('is a project owner name map with child project number maps with child column maps(see above) when the config initialized with a json using projects', () => {
        const config = new Config(ConfigTestData.projectMinimal, logger)
        const labelingRules = config.getLabelingRules()

        expect(labelingRules).toBeInstanceOf(Map)

        for (const [key, value] of labelingRules.entries()) { // Project owner name map
          expect(TypeChecker.isString(key)).toBe(true)
          expect(value).toBeInstanceOf(Map)

          for (const [childMapKeyDepth1, childMapValueDepth1] of value) { // Project number map
            expect(typeof childMapKeyDepth1).toBe('number')
            expect(childMapValueDepth1 instanceof Map).toBe(true)

            for (const [childMapKeyDepth2, childMapValueDepth2] of childMapValueDepth1) { // Columns map
              expect(TypeChecker.isString(childMapKeyDepth2)).toBe(true)
              expect(childMapValueDepth2).toBeInstanceOf(Map)

              for (const [childMapKeyDepth3, childMapValueDepth3] of childMapValueDepth2) { // Labeling actions map
                expect(childMapKeyDepth3 as string in LabelingAction).toBe(true)
                expect(Array.isArray(childMapValueDepth3)).toBe(true)
              }
            }
          }
        }
      })
    })

    describe('when the config has duplicates among its labeling rules', () => {
      describe('duplicate project merging', () => {
        let configInputJSON: ConfigPOJO
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]
        let labelingRuleContainer: ProjectLabelingRuleContainer
        let projectDuplicateNameAndNumberName: string
        let projectDuplicateNameAndNumberNumber: number
        let projectDuplicateNameOnlyName: string

        beforeAll(() => {
          resetSpies()
          const configInputJSONString = ConfigTestData.configDuplicates
          configInputJSON = JSON.parse(configInputJSONString)
          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
          projectDuplicateNameAndNumberName = configInputJSON.projects![0].ownerLogin.toLocaleLowerCase()
          projectDuplicateNameAndNumberNumber = configInputJSON.projects![0].number
          projectDuplicateNameOnlyName = configInputJSON.projects![2].ownerLogin.toLocaleLowerCase()

          const config = new Config(configInputJSONString, logger)
          labelingRuleContainer = config.getLabelingRules() as ProjectLabelingRuleContainer
        })

        it('includes each unique project name', () => {
          expect(labelingRuleContainer.has(projectDuplicateNameAndNumberName)).toBe(true)
          expect(labelingRuleContainer.has(projectDuplicateNameOnlyName)).toBe(true)
        })

        it('places each project number under the correct project name', () => {
          expect(labelingRuleContainer.get(projectDuplicateNameAndNumberName)?.has(projectDuplicateNameAndNumberNumber)).toBe(true)
          expect(labelingRuleContainer.get(projectDuplicateNameOnlyName)?.has(0)).toBe(true)
        })

        describe('duplicate child column merging', () => {
          let columnAAsymmetricName: string
          let columnASymmetricName: string
          let columnBAsymmetricName: string
          let columnBSymmetricName: string
          let columnCAsymmetricName: string

          beforeAll(() => {
            columnAAsymmetricName = configInputJSON.projects![1].columns[1].name.toLocaleLowerCase()
            columnASymmetricName = configInputJSON.projects![1].columns[0].name.toLocaleLowerCase()
            columnBAsymmetricName = configInputJSON.projects![3].columns[1].name.toLocaleLowerCase()
            columnBSymmetricName = configInputJSON.projects![3].columns[0].name.toLocaleLowerCase()
            columnCAsymmetricName = configInputJSON.projects![3].columns[3].name.toLocaleLowerCase()
          })

          it('includes each unique column name under the correct project number', () => {
            const parentProjectA = labelingRuleContainer.get(projectDuplicateNameAndNumberName)?.get(projectDuplicateNameAndNumberNumber)
            const parentProjectB = labelingRuleContainer.get(projectDuplicateNameOnlyName)?.get(0)

            expect(parentProjectA?.has(columnAAsymmetricName)).toBe(true)
            expect(parentProjectA?.has(columnASymmetricName)).toBe(true)
            expect(parentProjectB?.has(columnBAsymmetricName)).toBe(true)
            expect(parentProjectB?.has(columnBSymmetricName)).toBe(true)
            expect(parentProjectB?.has(columnCAsymmetricName)).toBe(true)
          })

          describe('child labeling action merges', () => {
            let labelForColumnAAsymmetricAddAction: string
            let labelForColumnAAsymmetricConflict: string
            let labelForColumnAAsymmetricRemoveAction: string
            let labelForColumnASymmetricAddActionA: string
            let labelForColumnASymmetricAddActionB: string
            let labelForColumnASymmetricAddActionC: string
            let labelForColumnASymmetricAddActionD: string
            let labelForColumnBAsymmetricRemoveActionE: string
            let labelForColumnBAsymmetricRemoveActionF: string
            let labelForColumnBAsymmetricRemoveActionDuplicateA: string
            let labelForColumnBAsymmetricRemoveActionDuplicateB: string
            let labelForColumnBSymmetricOverridingA: string
            let labelForColumnCAsymmetricOverridingB: string

            beforeAll(() => {
              labelForColumnAAsymmetricAddAction = configInputJSON.projects![1].columns[2].labelingActions[0].labels[0]
              labelForColumnAAsymmetricConflict = configInputJSON.projects![1].columns[2].labelingActions[0].labels[1]
              labelForColumnAAsymmetricRemoveAction = configInputJSON.projects![1].columns[1].labelingActions[0].labels[0]
              labelForColumnASymmetricAddActionA = configInputJSON.projects![0].columns[0].labelingActions[0].labels[0]
              labelForColumnASymmetricAddActionB = configInputJSON.projects![1].columns[0].labelingActions[0].labels[0]
              labelForColumnASymmetricAddActionC = configInputJSON.projects![0].columns[0].labelingActions[0].labels[1]
              labelForColumnASymmetricAddActionD = configInputJSON.projects![1].columns[0].labelingActions[0].labels[1]
              labelForColumnBAsymmetricRemoveActionE = configInputJSON.projects![3].columns[2].labelingActions[0].labels[1]
              labelForColumnBAsymmetricRemoveActionF = configInputJSON.projects![3].columns[2].labelingActions[0].labels[0]
              labelForColumnBAsymmetricRemoveActionDuplicateA = configInputJSON.projects![3].columns[1].labelingActions[0].labels[0]
              labelForColumnBAsymmetricRemoveActionDuplicateB = configInputJSON.projects![3].columns[2].labelingActions[0].labels[2]
              labelForColumnBSymmetricOverridingA = configInputJSON.projects![3].columns[0].labelingActions[0].labels[0]
              labelForColumnCAsymmetricOverridingB = configInputJSON.projects![3].columns[4].labelingActions[0].labels[0]
            })

            describe('actions not including a set rule and one with a set rule', () => {
              it('includes only the set rule', () => {
                const mergedColumnContainers = labelingRuleContainer.get(projectDuplicateNameOnlyName)?.get(0)?.get(columnBSymmetricName)

                expect(mergedColumnContainers).not.toBeUndefined()
                expect(mergedColumnContainers!.get(LabelingAction.REMOVE)).toBeUndefined()
                expect(mergedColumnContainers!.get(LabelingAction.SET)).toEqual([labelForColumnBSymmetricOverridingA])
              })
            })

            describe('an add action and a remove action', () => {
              it('includes both rules in the Map', () => {
                const mergedColumnContainers = labelingRuleContainer.get(projectDuplicateNameAndNumberName)?.get(projectDuplicateNameAndNumberNumber)?.get(columnAAsymmetricName)

                expect(mergedColumnContainers).not.toBeUndefined()
                expect(mergedColumnContainers!.get(LabelingAction.ADD)).toEqual([labelForColumnAAsymmetricAddAction])
                expect(mergedColumnContainers!.get(LabelingAction.REMOVE)).toEqual([labelForColumnAAsymmetricRemoveAction])
              })

              it('removes the same labels between the rules', () => {
                const mergedColumnContainers = labelingRuleContainer.get(projectDuplicateNameAndNumberName)?.get(projectDuplicateNameAndNumberNumber)?.get(columnAAsymmetricName)

                expect(mergedColumnContainers).not.toBeUndefined()
                expect(mergedColumnContainers!.get(LabelingAction.ADD)).not.toContain(labelForColumnAAsymmetricConflict)
                expect(mergedColumnContainers!.get(LabelingAction.REMOVE)).not.toContain(labelForColumnAAsymmetricConflict)
              })

              it('prints a warning upon removing a conflicting pair of labels', () => {
                expect(consoleWarnCalls.find((warnCall) => {
                  return /Found same label: "conflicting label" in both ADD and REMOVE labeling actions\. Removing label\./.test(warnCall[0])
                })).not.toBe(undefined)
              })
            })

            describe('multiple add actions', () => {
              let mergedLabels: string[] | undefined

              beforeAll(() => {
                mergedLabels = labelingRuleContainer.get(projectDuplicateNameAndNumberName)?.get(projectDuplicateNameAndNumberNumber)?.get(columnASymmetricName)?.get(LabelingAction.ADD)
              })

              it('combines the labels of both rules', () => {
                expect(mergedLabels?.slice().sort()).toEqual([labelForColumnASymmetricAddActionA, labelForColumnASymmetricAddActionB, labelForColumnASymmetricAddActionC, labelForColumnASymmetricAddActionD].sort())
              })

              it('alphabetizes the labels', () => {
                const lowercaseMergedLabels = stringArrayToLowercase(mergedLabels!)
                expect(lowercaseMergedLabels).toEqual(lowercaseMergedLabels.slice().sort())
              })
            })

            describe('multiple remove actions', () => {
              let mergedLabels: string[] | undefined

              beforeAll(() => {
                mergedLabels = labelingRuleContainer.get(projectDuplicateNameOnlyName)?.get(0)?.get(columnBAsymmetricName)?.get(LabelingAction.REMOVE)
              })

              it('combines the labels of both rules', () => {
                expect(mergedLabels?.slice().sort()).toEqual([labelForColumnBAsymmetricRemoveActionE, labelForColumnBAsymmetricRemoveActionF, labelForColumnBAsymmetricRemoveActionDuplicateA].sort())
              })

              it('alphabetizes the lables', () => {
                const lowercaseMergedLabels = stringArrayToLowercase(mergedLabels!)
                expect(lowercaseMergedLabels).toEqual(lowercaseMergedLabels.slice().sort())
              })
            })

            describe('multiple set actions', () => {
              it('includes the set rule that appears later in the list', () => {
                const mergedColumnContainers = labelingRuleContainer.get(projectDuplicateNameOnlyName)?.get(0)?.get(columnCAsymmetricName)

                expect(mergedColumnContainers).not.toBeUndefined()
                expect(mergedColumnContainers!.get(LabelingAction.SET)).toEqual([labelForColumnCAsymmetricOverridingB])
              })

              test('a warning is printed stating that only the last "SET" rule will be used', () => {
                const precedenceWarning = consoleWarnCalls.findIndex((consoleArgs) => {
                  return /Found duplicate labeling action: SET\. Selecting labels: \[.*\] because it appears lower in the config/.test(consoleArgs[0])
                })

                expect(precedenceWarning).not.toBe(-1)
              })
            })

            describe('child label duplicates', () => {
              it('removes the duplicate labels', () => {
                expect(labelForColumnBAsymmetricRemoveActionDuplicateA).not.toBe(undefined)
                expect(labelForColumnBAsymmetricRemoveActionDuplicateA).toBe(labelForColumnBAsymmetricRemoveActionDuplicateB)
                expect(labelingRuleContainer.get(projectDuplicateNameOnlyName)?.get(0)?.get(columnBAsymmetricName)?.get(LabelingAction.REMOVE)?.filter((label) => {
                  return label === labelForColumnBAsymmetricRemoveActionDuplicateA
                }).length).toBe(1)
              })
            })
          })
        })
      })

      describe('merges that should be triggered regardless of case differences in strings', () => {
        let configInputJSON: ConfigPOJO
        let labelingRuleContainer: ProjectLabelingRuleContainer
        let projectDuplicateNameAUppercase: string
        let projectDuplicateNameALowercase: string
        let projectDuplicateNameBUppercase: string
        let projectDuplicateNameBLowercase: string

        beforeAll(() => {
          resetSpies()
          const configInputJSONString = ConfigTestData.configDuplicatesWithCaseMismatch
          const config = new Config(configInputJSONString, logger)
          configInputJSON = JSON.parse(configInputJSONString)
          projectDuplicateNameAUppercase = configInputJSON.projects![0].ownerLogin
          projectDuplicateNameALowercase = configInputJSON.projects![1].ownerLogin
          projectDuplicateNameBUppercase = configInputJSON.projects![2].ownerLogin
          projectDuplicateNameBLowercase = configInputJSON.projects![3].ownerLogin

          labelingRuleContainer = config.getLabelingRules() as ProjectLabelingRuleContainer
        })

        describe('duplicate projects with case differences', () => {
          it('considers them the same', () => {
            expect(projectDuplicateNameALowercase).not.toBe(projectDuplicateNameAUppercase)
            expect(projectDuplicateNameALowercase).toBe(projectDuplicateNameAUppercase.toLocaleLowerCase())

            expect(projectDuplicateNameBLowercase).not.toBe(projectDuplicateNameBUppercase)
            expect(projectDuplicateNameBLowercase).toBe(projectDuplicateNameBUppercase.toLocaleLowerCase())

            expect(projectDuplicateNameBLowercase.toLocaleLowerCase()).not.toBe(projectDuplicateNameALowercase.toLocaleLowerCase())

            expect(labelingRuleContainer.size).toBe(2)
            expect(labelingRuleContainer.has(projectDuplicateNameALowercase)).toBe(true)
            expect(labelingRuleContainer.get(projectDuplicateNameALowercase)?.size).toBe(1)
            expect(labelingRuleContainer.has(projectDuplicateNameBLowercase)).toBe(true)
            expect(labelingRuleContainer.get(projectDuplicateNameBLowercase)?.size).toBe(1)
          })

          describe('duplicate columns with case differences', () => {
            let columnDuplicateNameAUppercase: string
            let columnDuplicateNameALowercase: string
            let columnDuplicateNameBUppercase: string
            let columnDuplicateNameBLowercase: string
            let columnDuplicateNameCUppercase: string
            let columnDuplicateNameCLowercase: string
            let projectDuplicateNumberA: number

            beforeAll(() => {
              projectDuplicateNumberA = configInputJSON.projects![0].number
              columnDuplicateNameAUppercase = configInputJSON.projects![0].columns[0].name
              columnDuplicateNameALowercase = configInputJSON.projects![1].columns[0].name
              columnDuplicateNameBUppercase = configInputJSON.projects![1].columns[1].name
              columnDuplicateNameBLowercase = configInputJSON.projects![1].columns[2].name
              columnDuplicateNameCUppercase = configInputJSON.projects![2].columns[0].name
              columnDuplicateNameCLowercase = configInputJSON.projects![3].columns[0].name
            })

            it('still considers them as duplicates so only one version of the name remains', () => {
              expect(columnDuplicateNameALowercase).not.toBe(columnDuplicateNameAUppercase)
              expect(columnDuplicateNameALowercase).toBe(columnDuplicateNameAUppercase.toLocaleLowerCase())

              expect(columnDuplicateNameBLowercase).not.toBe(columnDuplicateNameBUppercase)
              expect(columnDuplicateNameBLowercase).toBe(columnDuplicateNameBUppercase.toLocaleLowerCase())

              expect(columnDuplicateNameCLowercase).not.toBe(columnDuplicateNameCUppercase)
              expect(columnDuplicateNameCLowercase).toBe(columnDuplicateNameCUppercase.toLocaleLowerCase())

              expect(columnDuplicateNameALowercase.toLocaleLowerCase()).not.toBe(columnDuplicateNameBLowercase.toLocaleLowerCase())
              expect(columnDuplicateNameALowercase.toLocaleLowerCase()).not.toBe(columnDuplicateNameCLowercase.toLocaleLowerCase())
              expect(columnDuplicateNameBLowercase.toLocaleLowerCase()).not.toBe(columnDuplicateNameCLowercase.toLocaleLowerCase())

              const projectA = labelingRuleContainer.get(projectDuplicateNameALowercase)?.get(projectDuplicateNumberA)
              expect(projectA?.size).toBe(2)
              expect(projectA?.has(columnDuplicateNameALowercase)).toBe(true)
              expect(projectA?.has(columnDuplicateNameBLowercase)).toBe(true)

              const projectB = labelingRuleContainer.get(projectDuplicateNameBLowercase)?.get(0)
              expect(projectB?.size).toBe(1)
              expect(projectB?.has(columnDuplicateNameCLowercase)).toBe(true)
            })

            describe('the case differences of labeling actions', () => {
              let addActionA: string
              let addActionB: string
              let addActionC: string
              let removeActionA: string
              let removeActionB: string
              let setAction: string

              beforeAll(() => {
                addActionA = configInputJSON.projects![0].columns[0].labelingActions[0].action
                addActionB = configInputJSON.projects![1].columns[0].labelingActions[0].action
                addActionC = configInputJSON.projects![1].columns[2].labelingActions[0].action
                removeActionA = configInputJSON.projects![1].columns[1].labelingActions[0].action
                removeActionB = configInputJSON.projects![2].columns[0].labelingActions[0].action
                setAction = configInputJSON.projects![3].columns[0].labelingActions[0].action
              })

              it('does not affect how add actions are handled', () => {
                expect(caseInsensitiveCompare(addActionA, 'add')).toBe(0)
                expect(caseInsensitiveCompare(addActionB, 'add')).toBe(0)
                expect(caseInsensitiveCompare(addActionC, 'add')).toBe(0)

                expect(labelingRuleContainer.get(projectDuplicateNameALowercase)?.get(projectDuplicateNumberA)?.get(columnDuplicateNameALowercase)?.has(LabelingAction.ADD)).toBe(true)
                expect(labelingRuleContainer.get(projectDuplicateNameALowercase)?.get(projectDuplicateNumberA)?.get(columnDuplicateNameBLowercase)?.has(LabelingAction.ADD)).toBe(true)
              })

              it('does not affect how remove actions are handled', () => {
                expect(caseInsensitiveCompare(removeActionA, 'remove')).toBe(0)
                expect(caseInsensitiveCompare(removeActionB, 'remove')).toBe(0)

                expect(labelingRuleContainer.get(projectDuplicateNameALowercase)?.get(projectDuplicateNumberA)?.get(columnDuplicateNameBLowercase)?.has(LabelingAction.REMOVE)).toBe(true)
                expect(labelingRuleContainer.get(projectDuplicateNameBLowercase)?.get(0)?.get(columnDuplicateNameCLowercase)?.has(LabelingAction.REMOVE)).toBe(false)
              })

              it('does not affect how set actions are handled', () => {
                expect(caseInsensitiveCompare(setAction, 'set')).toBe(0)
                expect(labelingRuleContainer.get(projectDuplicateNameBLowercase)?.get(0)?.get(columnDuplicateNameCLowercase)?.has(LabelingAction.SET)).toBe(true)
              })

              describe('duplicate labels with case differences', () => {
                let duplicateLabelLowercase: string
                let duplicateLabelUppercase: string
                let conflictingLabelLowercase: string
                let conflictingLabelUppercase: string

                beforeAll(() => {
                  duplicateLabelLowercase = configInputJSON.projects![0].columns[0].labelingActions[0].labels[1]
                  duplicateLabelUppercase = configInputJSON.projects![1].columns[0].labelingActions[0].labels[1]
                  conflictingLabelLowercase = configInputJSON.projects![1].columns[1].labelingActions[0].labels[1]
                  conflictingLabelUppercase = configInputJSON.projects![1].columns[2].labelingActions[0].labels[1]
                })

                it('removes the duplicates', () => {
                  expect(caseInsensitiveCompare(duplicateLabelLowercase, duplicateLabelUppercase)).toBe(0)

                  const labels = labelingRuleContainer.get(projectDuplicateNameALowercase)?.get(projectDuplicateNumberA)?.get(columnDuplicateNameALowercase)?.get(LabelingAction.ADD)
                  expect(labels?.filter((label) => {
                    return caseInsensitiveCompare(label, duplicateLabelLowercase) === 0
                  }).length).toBe(1)
                })

                it('removes conflicting labels', () => {
                  expect(caseInsensitiveCompare(conflictingLabelLowercase, conflictingLabelUppercase)).toBe(0)

                  const addActionLabels = labelingRuleContainer.get(projectDuplicateNameALowercase)?.get(projectDuplicateNumberA)?.get(columnDuplicateNameBLowercase)?.get(LabelingAction.ADD)
                  const removeActionLabels = labelingRuleContainer.get(projectDuplicateNameALowercase)?.get(projectDuplicateNumberA)?.get(columnDuplicateNameBLowercase)?.get(LabelingAction.REMOVE)

                  expect(addActionLabels?.find((label) => {
                    return caseInsensitiveCompare(conflictingLabelLowercase, label) === 0
                  })).toBe(undefined)

                  expect(removeActionLabels?.find((label) => {
                    return caseInsensitiveCompare(conflictingLabelLowercase, label) === 0
                  })).toBe(undefined)
                })
              })
            })
          })
        })
      })
    })

    describe('non duplicate projects', () => {
      let columnName1: string
      let columnName2: string
      let columnName3: string
      let labelingRuleContainer: ProjectLabelingRuleContainer
      let label1Set: string[]
      let label2Set: string[]
      let label3Set: string[]
      let projectNameShared: string
      let projectNameUnique: string
      let projectNumberShared: number
      let projectNumberUnique: number

      beforeAll(() => {
        const configInputJSONString = ConfigTestData.projectNearDuplicates
        const configInputJSON = JSON.parse(configInputJSONString)

        columnName1 = configInputJSON.projects[0].columns[0].name.toLocaleLowerCase()
        columnName2 = configInputJSON.projects[1].columns[0].name.toLocaleLowerCase()
        columnName3 = configInputJSON.projects[2].columns[0].name.toLocaleLowerCase()
        label1Set = configInputJSON.projects[0].columns[0].labelingActions[0].labels
        label2Set = configInputJSON.projects[1].columns[0].labelingActions[0].labels
        label3Set = configInputJSON.projects[2].columns[0].labelingActions[0].labels
        projectNameShared = configInputJSON.projects[0].ownerLogin.toLocaleLowerCase()
        projectNameUnique = configInputJSON.projects[2].ownerLogin.toLocaleLowerCase()
        projectNumberShared = configInputJSON.projects[0].number
        projectNumberUnique = configInputJSON.projects[1].number

        const config = new Config(configInputJSONString, logger)
        labelingRuleContainer = config.getLabelingRules() as ProjectLabelingRuleContainer
      })

      describe('when there are projects sharing names but not numbers', () => {
        it('places each child column under the correct project', () => {
          const projectNumberMap = labelingRuleContainer.get(projectNameShared)

          expect(projectNumberMap?.get(projectNumberShared)?.has(columnName1)).toBe(true)
          expect(projectNumberMap?.get(projectNumberShared)?.has(columnName2)).toBe(false)
          expect(projectNumberMap?.get(projectNumberUnique)?.has(columnName2)).toBe(true)
          expect(projectNumberMap?.get(projectNumberUnique)?.has(columnName1)).toBe(false)
        })

        it('includes both projects', () => {
          const projectNumberMap = labelingRuleContainer.get(projectNameShared)

          expect(projectNumberMap).not.toBe(undefined)
          expect(projectNumberMap!.has(projectNumberShared)).not.toBe(undefined)
          expect(projectNumberMap!.has(projectNumberUnique)).not.toBe(undefined)
        })
      })

      describe('when there are projects sharing numbers but not names', () => {
        test('their child columns are not merged', () => {
          const projectNumberMapA = labelingRuleContainer.get(projectNameShared)
          const projectNumberMapB = labelingRuleContainer.get(projectNameUnique)

          expect(projectNumberMapA?.get(projectNumberShared)?.has(columnName1)).toBe(true)
          expect(projectNumberMapA?.get(projectNumberShared)?.has(columnName3)).toBe(false)
          expect(projectNumberMapB?.get(projectNumberShared)?.has(columnName3)).toBe(true)
          expect(projectNumberMapB?.get(projectNumberShared)?.has(columnName1)).toBe(false)
        })

        test('both projects appear in the labeling rule container', () => {
          const projectNumberMapA = labelingRuleContainer.get(projectNameShared)
          const projectNumberMapB = labelingRuleContainer.get(projectNameUnique)

          expect(projectNumberMapA).not.toBe(undefined)
          expect(projectNumberMapB).not.toBe(undefined)
          expect(projectNumberMapA!.has(projectNumberShared)).not.toBe(undefined)
          expect(projectNumberMapB!.has(projectNumberShared)).not.toBe(undefined)
        })
      })

      describe('the completeness of the data', () => {
        it('contains all project owner names', () => {
          expect(labelingRuleContainer.has(projectNameShared)).toBe(true)
          expect(labelingRuleContainer.has(projectNameUnique)).toBe(true)
        })

        it('contains all project numbers under the correct project name', () => {
          const parentOfProjectNumbers1AAnd2 = labelingRuleContainer.get(projectNameShared)
          const parentOfProjectNumber1B = labelingRuleContainer.get(projectNameUnique)

          expect(parentOfProjectNumbers1AAnd2?.has(1)).toBe(true)
          expect(parentOfProjectNumbers1AAnd2?.has(2)).toBe(true)
          expect(parentOfProjectNumber1B?.has(1)).toBe(true)
        })

        it('contains all column names under the correct project number', () => {
          const parentOfColumnName1 = labelingRuleContainer.get(projectNameShared)?.get(1)
          const parentOfColumnName2 = labelingRuleContainer.get(projectNameShared)?.get(2)
          const parentOfColumnName3 = labelingRuleContainer.get(projectNameUnique)?.get(1)

          expect(parentOfColumnName1?.has(columnName1)).toBe(true)
          expect(parentOfColumnName2?.has(columnName2)).toBe(true)
          expect(parentOfColumnName3?.has(columnName3)).toBe(true)
        })

        it('contains all labeling actions under the correct column', () => {
          const parentOfLabelingActionAdd = labelingRuleContainer.get(projectNameShared)?.get(1)?.get(columnName1)
          const parentOfLabelingActionRemove = labelingRuleContainer.get(projectNameShared)?.get(2)?.get(columnName2)
          const parentOfLabelingActionSet = labelingRuleContainer.get(projectNameUnique)?.get(1)?.get(columnName3)

          expect(parentOfLabelingActionAdd?.has(LabelingAction.ADD)).toBe(true)
          expect(parentOfLabelingActionRemove?.has(LabelingAction.REMOVE)).toBe(true)
          expect(parentOfLabelingActionSet?.has(LabelingAction.SET)).toBe(true)
        })

        describe('the labels', () => {
          let validatedLabel1Set: string[] | undefined
          let validatedLabel2Set: string[] | undefined
          let validatedLabel3Set: string[] | undefined

          beforeAll(() => {
            validatedLabel1Set = labelingRuleContainer.get(projectNameShared)?.get(1)?.get(columnName1)?.get(LabelingAction.ADD)
            validatedLabel2Set = labelingRuleContainer.get(projectNameShared)?.get(2)?.get(columnName2)?.get(LabelingAction.REMOVE)
            validatedLabel3Set = labelingRuleContainer.get(projectNameUnique)?.get(1)?.get(columnName3)?.get(LabelingAction.SET)
          })

          it('contains all label sets under the correct labeling action', () => {
            expect(validatedLabel1Set?.slice().sort()).toEqual(label1Set.slice().sort())
            expect(validatedLabel2Set?.slice().sort()).toEqual(label2Set.slice().sort())
            expect(validatedLabel3Set?.slice().sort()).toEqual(label3Set.slice().sort())
          })

          it('sorts the labels alphabetically', () => {
            expect(validatedLabel1Set).not.toBeUndefined()
            expect(validatedLabel2Set).not.toBeUndefined()
            expect(validatedLabel3Set).not.toBeUndefined()

            const lowercaseValidatedLabel1Set = stringArrayToLowercase(validatedLabel1Set!)
            const lowercaseValidatedLabel2Set = stringArrayToLowercase(validatedLabel2Set!)
            const lowercaseValidatedLabel3Set = stringArrayToLowercase(validatedLabel3Set!)

            expect(lowercaseValidatedLabel1Set).toEqual(lowercaseValidatedLabel1Set.slice().sort())
            expect(lowercaseValidatedLabel2Set).toEqual(lowercaseValidatedLabel2Set.slice().sort())
            expect(lowercaseValidatedLabel3Set).toEqual(lowercaseValidatedLabel3Set.slice().sort())
          })
        })
      })
    })
  })

  describe('isProjectMode()', () => {
    it('returns true if the input json is using the projects key', () => {
      const config = new Config(ConfigTestData.projectMinimal, logger)

      expect(config.isProjectMode()).toBe(true)
    })

    it('returns true if the input json is using the projects key and the columns key', () => {
      const config = new Config(ConfigTestData.projectOverridingColumn, logger)

      expect(config.isProjectMode()).toBe(true)
    })

    it('returns false if the input json is using the columns key and not the projects key', () => {
      const config = new Config(ConfigTestData.columnMinimal, logger)

      expect(config.isProjectMode()).toBe(false)
    })
  })

  describe('toString()', () => {
    let apiToken: string
    let columnNameA: string
    let columnNameB: string
    let configToString: string
    let labelA: string
    let labelB: string
    let labelC: string
    let projectNumberA: string
    let projectNumberB: string
    let projectOwnerNameA: string
    let projectOwnerNameB: string
    let repoName: string
    let repoOwnerName: string

    beforeAll(() => {
      const configInputJSONString = ConfigTestData.projectConfigWithSiblingsAndHighEntropyValues
      const configInputJSON = JSON.parse(configInputJSONString)
      apiToken = configInputJSON.accessToken
      columnNameA = configInputJSON.projects[0].columns[0].name
      columnNameB = configInputJSON.projects[1].columns[0].name
      labelA = configInputJSON.projects[0].columns[0].labelingActions[0].labels[0]
      labelB = configInputJSON.projects[1].columns[0].labelingActions[0].labels[0]
      labelC = configInputJSON.projects[1].columns[0].labelingActions[0].labels[1]
      projectNumberA = configInputJSON.projects[0].number
      projectNumberB = configInputJSON.projects[1].number
      projectOwnerNameA = configInputJSON.projects[0].ownerLogin
      projectOwnerNameB = configInputJSON.projects[1].ownerLogin
      repoName = configInputJSON.repo.name
      repoOwnerName = configInputJSON.repo.ownerName

      configToString = new Config(configInputJSONString, logger).toString()
    })

    it('includes the api token', () => {
      expect(configToString).toContain(apiToken)
    })

    it('includes the repo name', () => {
      expect(configToString).toContain(repoName)
    })

    it('includes the repo owner name', () => {
      expect(configToString).toContain(repoOwnerName)
    })

    it('includes all project numbers', () => {
      expect(configToString).toContain(projectNumberA.toString())
      expect(configToString).toContain(projectNumberB.toString())
    })

    it('includes all project owner names', () => {
      // JSON.stringify is used here to match the json escaped version of the strings
      expect(configToString).toContain(JSON.stringify(projectOwnerNameA.toLocaleLowerCase()))
      expect(configToString).toContain(JSON.stringify(projectOwnerNameB.toLocaleLowerCase()))
    })

    it('includes all column names', () => {
      expect(configToString).toContain(JSON.stringify(columnNameA.toLocaleLowerCase()))
      expect(configToString).toContain(JSON.stringify(columnNameB.toLocaleLowerCase()))
    })

    it('includes all labels', () => {
      expect(configToString).toContain(JSON.stringify(labelA))
      expect(configToString).toContain(JSON.stringify(labelB))
      expect(configToString).toContain(JSON.stringify(labelC))
    })
  })

  describe('trailing whitespace values', () => {
    let config: Config
    let configAsJSON: any

    beforeAll(() => {
      const configString = ConfigTestData.configTrailingWhitespaceValues
      configAsJSON = JSON.parse(configString)
      config = new Config(configString, logger)
    })

    describe('the github access token', () => {
      it('trims trailing whitespace', () => {
        const inputAPIToken = configAsJSON.accessToken
        const validatedAPIToken = config.getAPIToken()

        expect(inputAPIToken.length).not.toBe(0)
        expect(validatedAPIToken).toBe(inputAPIToken.trim())
      })
    })

    describe('the repo owner', () => {
      it('trims trailing whitespace', () => {
        const inputRepoOwnerName = configAsJSON.repo.ownerName
        const validatedRepoOwnerName = config.getRepoOwnerName()

        expect(inputRepoOwnerName.length).not.toBe(0)
        expect(validatedRepoOwnerName).toBe(inputRepoOwnerName.trim())
      })
    })

    describe('the repo name', () => {
      it('trims trailing whitespace', () => {
        const inputRepoName = configAsJSON.repo.name
        const validatedRepoName = config.getRepoName()

        expect(inputRepoName.length).not.toBe(0)
        expect(validatedRepoName).toBe(inputRepoName.trim())
      })
    })

    describe('project owner names', () => {
      it('trims trailing whitespace', () => {
        const projectOwnerNames = config.getLabelingRules().keys()

        for (const projectOwnerName of projectOwnerNames) {
          expect(projectOwnerName.length).not.toBe(0)
          expect(projectOwnerName).toBe(projectOwnerName.trim())
        }
      })

      it('considers whether the project name is a duplicate after trimming', () => {
        expect(configAsJSON.projects.length).toBe(2)

        const inputProjectNameA = configAsJSON.projects[0].ownerLogin
        const inputProjectNameB = configAsJSON.projects[1].ownerLogin

        expect(caseInsensitiveCompare(inputProjectNameA.trim(), inputProjectNameB.trim())).toBe(0)
        expect(config.getLabelingRules().size).toBe(1)
      })
    })

    describe('column names', () => {
      it('trims trailing whitespace', () => {
        const inputColumnName = configAsJSON.projects[0].columns[0].name
        const labelingRules: ProjectLabelingRuleContainer = config.getLabelingRules() as ProjectLabelingRuleContainer
        const validatedColumnName = firstKeyValuePairOfMap(firstKeyValuePairOfMap(firstKeyValuePairOfMap(labelingRules)!.value)!.value)!.key

        expect(inputColumnName.length).not.toBe(0)
        expect(validatedColumnName).toBe(inputColumnName.trim())
      })

      it('considers whether the column names are duplicates after trimming', () => {
        // Proves the input column names are from the only 2 columns
        expect(configAsJSON.projects.length).toBe(2)
        expect(configAsJSON.projects[0].columns.length).toBe(1)
        expect(configAsJSON.projects[1].columns.length).toBe(1)

        const inputColumnNameA = configAsJSON.projects[0].columns[0].name
        const inputColumnNameB = configAsJSON.projects[1].columns[0].name
        const labelingRules = config.getLabelingRules()

        expect(caseInsensitiveCompare(inputColumnNameA.trim(), inputColumnNameB.trim())).toBe(0)
        expect(labelingRules.size).toBe(1)
        expect(labelingRules.get(firstKeyValuePairOfMap(labelingRules)!.key)?.size).toBe(1)
      })
    })

    describe('labels', () => {
      it('trims trailing whitespace', () => {
        const inputLabelSetA = configAsJSON.projects[0].columns[0].labelingActions[0].labels
        const inputLabelSetB = configAsJSON.projects[1].columns[0].labelingActions[0].labels
        const validatedLabels = firstKeyValuePairOfMap(
          firstKeyValuePairOfMap(
            firstKeyValuePairOfMap(
              firstKeyValuePairOfMap(
                config.getLabelingRules() // Project Name Map
              )!.value // Project Number Map
            )!.value // Column Name Map
          )!.value // Labeling Action Map
        )!.value // Labels

        expect(inputLabelSetA.length).not.toBe(0)

        for (const label in inputLabelSetA) {
          expect(label.length).not.toBe(0)
          expect(validatedLabels.find((validatedLabel: string) => {
            return caseInsensitiveCompare(validatedLabel, label.trim())
          })).not.toBeUndefined()
        }

        expect(inputLabelSetB.length).not.toBe(0)

        for (const label in inputLabelSetB) {
          expect(label.length).not.toBe(0)
          expect(validatedLabels.find((validatedLabel: string) => {
            return caseInsensitiveCompare(validatedLabel, label.trim())
          })).not.toBeUndefined()
        }
      })

      it('considers whether the labels are duplicates after trimming', () => {
        const inputLabel1DuplicateA = configAsJSON.projects[0].columns[0].labelingActions[0].labels[0]
        const inputLabel1DuplicateB = configAsJSON.projects[1].columns[0].labelingActions[0].labels[0]
        const inputLabel2DuplicateA = configAsJSON.projects[0].columns[0].labelingActions[0].labels[1]
        const inputLabel2DuplicateB = configAsJSON.projects[0].columns[0].labelingActions[0].labels[2]

        expect(inputLabel1DuplicateA.trim()).toBe(inputLabel1DuplicateB.trim())
        expect(inputLabel2DuplicateA.trim()).toBe(inputLabel2DuplicateB.trim())

        const labelingRules = config.getLabelingRules()

        expect(labelingRules.size).toBe(1)
        expect(firstKeyValuePairOfMap(labelingRules)!.value.size).toBe(1)
        expect(firstKeyValuePairOfMap(firstKeyValuePairOfMap(labelingRules)!.value)?.value.size).toBe(1)
        expect(firstKeyValuePairOfMap(firstKeyValuePairOfMap(firstKeyValuePairOfMap(labelingRules)!.value)?.value)?.value.size).toBe(1)

        const validatedLabels = firstKeyValuePairOfMap(
          firstKeyValuePairOfMap(
            firstKeyValuePairOfMap(
              firstKeyValuePairOfMap(
                labelingRules // Project Name Map
              )!.value // Project Number Map
            )!.value // Column Name Map
          )!.value // Labeling Action Map
        )!.value // Labels

        expect(validatedLabels.filter((labelFromSetA: string) => {
          return caseInsensitiveCompare(labelFromSetA.trim(), inputLabel1DuplicateA.trim()) === 0
        }).length).toBe(1)
        expect(validatedLabels.filter((labelFromSetB: string) => {
          return caseInsensitiveCompare(labelFromSetB.trim(), inputLabel2DuplicateA.trim()) === 0
        }).length).toBe(1)
      })

      it('considers whether the labels are conflicts after trimming', () => {
        const conflictingLabelTrimmed = configAsJSON.projects[0].columns[0].labelingActions[0].labels[3]
        const conflictingLabelWhitespace = configAsJSON.projects[1].columns[0].labelingActions[1].labels[0]

        expect(conflictingLabelTrimmed).toBe(conflictingLabelWhitespace.trim())

        const labelingRules = config.getLabelingRules()

        expect(labelingRules.size).toBe(1)
        expect(firstKeyValuePairOfMap(labelingRules)!.value.size).toBe(1)
        expect(firstKeyValuePairOfMap(firstKeyValuePairOfMap(labelingRules)!.value)?.value.size).toBe(1)
        expect(firstKeyValuePairOfMap(firstKeyValuePairOfMap(firstKeyValuePairOfMap(labelingRules)!.value)?.value)?.value.size).toBe(1)
        expect(firstKeyValuePairOfMap(
          firstKeyValuePairOfMap(
            firstKeyValuePairOfMap(
              firstKeyValuePairOfMap(
                labelingRules // Project Name Map
              )!.value // Project Number Map
            )?.value // Column Map
          )?.value // Labeling Action Map
        )?.value // Labels
          .find((label: string) => {
            return label === conflictingLabelTrimmed
          })
        ).toBe(undefined)
      })
    })
  })
})
