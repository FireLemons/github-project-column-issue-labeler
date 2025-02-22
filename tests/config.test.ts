import ConfigTestData from './data/configTestData'
import { Config, LabelingAction, ProjectLabelingRuleContainer } from '../src/config'
import { Logger } from '../src/logger'
import * as TypeChecker from '../src/typeChecker'

const logger = new Logger()

function countSpaceIndentationOfLoggerMessage (text: string): number {
  return text.slice(11).search(/\S/)
}

function hasGreaterIndentation (expectedLesserIndentationMessage: string, expectedGreaterIndentationMessage: string): boolean {
  return countSpaceIndentationOfLoggerMessage(expectedGreaterIndentationMessage) - countSpaceIndentationOfLoggerMessage(expectedLesserIndentationMessage) === 2
}

function stringArrayToLowercase (strings: string[]) {
  const lowercaseStrings = []

  for (let i = 0; i < strings.length; i++) {
    lowercaseStrings.push(strings[i].toLocaleLowerCase())
  }

  return lowercaseStrings
}

const consoleLoggingFunctionSpies: {[name: string]: jest.SpiedFunction<typeof console.warn>} = {
  info: jest.spyOn(console, 'info'),
  warn: jest.spyOn(console, 'warn'),
  error: jest.spyOn(console, 'error')
}

function resetSpies () {
  for (const consoleLoggingFunctionName in consoleLoggingFunctionSpies) {
    consoleLoggingFunctionSpies[consoleLoggingFunctionName].mockReset()
  }
}

describe('Config', () => {
  describe('constructor', () => {
    describe('fatally invalid values', () => {
      describe('when config contains invalid json', () => {
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
  
        beforeAll(() => {
          resetSpies()
          consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
        })
  
        it('throws an error', () => {
          expect(() => {
            new Config(ConfigTestData.invalidJSON, logger)
          }).toThrow(SyntaxError)
        })
      })
  
      describe('when config is missing a required key', () => {
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
  
        beforeAll(() => {
          resetSpies()
          consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
        })
  
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

      describe('when the repo is of the wrong type', () => {
        it('throws an error with a message describing the problem', () => {
          const initConfig = () => {
            new Config(ConfigTestData.configWrongTypeRepo, logger)
          }
  
          expect(initConfig).toThrow(TypeError)
          expect(initConfig).toThrow('Member "repo" was found not to be an object')
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
            throw new Error('unimplimented')
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
            throw new Error('unimplimented')
          })
        })
      })
    })

    describe('repo', () => {
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

  describe('nonfatal invalid values', () => {
    describe('projects', () => {
      describe('when a project is not an object', () => {
        const PROJECTS_COUNT = 3
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]

        beforeAll(() => {
          resetSpies()
          
          try {
            new Config(ConfigTestData.projectArrayValuesWrongType, logger)
          } catch {
            // no valid projects in the config throws an error
          }

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        test('it prints warnings with the index of the invalid element', () => {
          for (let i = 0; i < PROJECTS_COUNT; i++) {
            expect(consoleWarnCalls[i * 2][0]).toMatch(/Could not make valid project\. Skipping project\./)
            expect(consoleWarnCalls[(i * 2) + 1][0]).toMatch(/Project must be an object/)
          }
        })

        test('it indents the error stack more than the preceding warning message', () => {
          for (let i = 0; i < PROJECTS_COUNT; i++) {
            expect(hasGreaterIndentation(consoleWarnCalls[i * 2][0], consoleWarnCalls[(i * 2) + 1][0])).toBe(true)
          }
        })
      })

      describe('when the project is missing a required key', () => {
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]

        beforeAll(() => {
          resetSpies()

          try {
            new Config(ConfigTestData.projectMissingRequiredKey, logger)
          } catch {
            // no valid projects in the config throws an error
          }

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        describe('when "columns" is missing', () => {
          test('warnings are printed about why the project is invalid and what will be done about the invalid project', () => {
            expect(consoleWarnCalls[0][0]).toMatch(/Could not make valid project\. Skipping project\./)
            expect(consoleWarnCalls[1][0]).toMatch(/key "columns" was not found in the object/)
          })
        })

        describe('when "ownerLogin" is missing', () => {
          test('warnings are printed about why the project is invalid and what will be done about the invalid project', () => {
            expect(consoleWarnCalls[2][0]).toMatch(/Could not make valid project\. Skipping project\./)
            expect(consoleWarnCalls[3][0]).toMatch(/key "ownerLogin" was not found in the object/)
          })
        })

        test('it indents the error stack more than the preceding warning message', () => {
          const PROJECT_COUNT = 2

          for(let i = 0; i < PROJECT_COUNT; i++) {
            expect(hasGreaterIndentation(consoleWarnCalls[i * 2][0], consoleWarnCalls[(i * 2) + 1][0])).toBe(true)
          }
        })
      })

      describe('when a project has invalid values', () => {
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]

        beforeAll(() => {
          resetSpies()

          try {
            new Config(ConfigTestData.projectInvalidValues, logger)
          } catch {
            // no valid projects in the config throws an error
          }

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        describe('when "columns" is of the wrong type', () => {
          test('warnings are printed about why the project is invalid and what will be done about the invalid project', () => {
            expect(consoleWarnCalls[0][0]).toMatch(/Could not make valid project\. Skipping project\./)
            expect(consoleWarnCalls[1][0]).toMatch(/Member "columns" was found not to be an array/)
          })
        })

        describe('when "number" is of the wrong type', () => {
          test('warnings are printed about why the project is invalid and what will be done about the invalid project', () => {
            expect(consoleWarnCalls[2][0]).toMatch(/Could not make valid project\. Skipping project\./)
            expect(consoleWarnCalls[3][0]).toMatch(/Member "number" was found not to be a number/)
          })
        })

        describe('when "number" is less than 1', () => {
          test('warnings are printed about why the project is invalid and what will be done about the invalid project', () => {
            expect(consoleWarnCalls[4][0]).toMatch(/Could not make valid project\. Skipping project\./)
            expect(consoleWarnCalls[5][0]).toMatch(/Number must be greater than 0/)
          })
        })

        describe('when "number" is not an integer', () => {
          test('warnings are printed about why the project is invalid and what will be done about the invalid project', () => {
            expect(consoleWarnCalls[6][0]).toMatch(/Could not make valid project\. Skipping project\./)
            expect(consoleWarnCalls[7][0]).toMatch(/Number must be an integer/)
          })
        })

        describe('when "ownerLogin" is of the wrong type', () => {
          test('warnings are printed about why the project is invalid and what will be done about the invalid project', () => {
            expect(consoleWarnCalls[8][0]).toMatch(/Could not make valid project\. Skipping project\./)
            expect(consoleWarnCalls[9][0]).toMatch(/Member "ownerLogin" was found not to be a string/)
          })
        })

        describe('when "ownerLogin" contains only whitespace', () => {
          test('warnings are printed about why the project is invalid and what will be done about the invalid project', () => {
            expect(consoleWarnCalls[10][0]).toMatch(/Could not make valid project\. Skipping project\./)
            expect(consoleWarnCalls[11][0]).toMatch(/ownerLogin must contain at least one non whitespace character/)
          })
        })

        describe('when "ownerLogin" is empty string', () => {
          test('warnings are printed about why the project is invalid and what will be done about the invalid project', () => {
            expect(consoleWarnCalls[12][0]).toMatch(/Could not make valid project\. Skipping project\./)
            expect(consoleWarnCalls[13][0]).toMatch(/ownerLogin must contain at least one non whitespace character/)
          })
        })

        test('it indents the error stack more than the preceding warning message', () => {
          const PROJECT_COUNT = 7

          for(let i = 0; i < PROJECT_COUNT; i++) {
            expect(hasGreaterIndentation(consoleWarnCalls[i * 2][0], consoleWarnCalls[(i * 2) + 1][0])).toBe(true)
          }
        })
      })

    describe('columns', () => {
      describe('when a column is not an object', () => {
        const COLUMN_COUNT = 3
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]

        beforeAll(() => {
          resetSpies()

          try {
            new Config(ConfigTestData.columnArrayValuesWrongType, logger)
          } catch {
            // no valid projects in the config throws an error
          }

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        it('warnings are printed about why the column is invalid and what will be done about the invalid column', () => {
          for (let i = 0; i < COLUMN_COUNT; i++) {
            expect(consoleWarnCalls[i * 2][0]).toMatch(/Could not make valid column\. Skipping column\./)
            expect(consoleWarnCalls[(i * 2) + 1][0]).toMatch(/Column must be an object/)
          }
        })

        test('it indents the error stack more than the preceding warning message', () => {
          for (let i = 0; i < COLUMN_COUNT; i++) {
            expect(hasGreaterIndentation(consoleWarnCalls[i * 2][0], consoleWarnCalls[(i * 2) + 1][0])).toBe(true)
          }
        })
      })

      /*describe('when the column is missing a required key', () => {
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.columnMissingRequiredKey

          configValidator.validateConfig(configContents.toString())

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        describe('when "labelingRules" is missing', () => {
          test('warnings are printed with the index of the invalid column', () => {
            expect(consoleWarnCalls[0][0]).toMatch(/Could not make valid column from value at index: 0\. Skipping column\./)
            expect(consoleWarnCalls[1][0]).toMatch(/key "labelingRules" was not found in the object/)
          })
        })

        describe('when "name" is missing', () => {
          test('warnings are printed with the index of the invalid column', () => {
            expect(consoleWarnCalls[2][0]).toMatch(/Could not make valid column from value at index: 1\. Skipping column\./)
            expect(consoleWarnCalls[3][0]).toMatch(/key "name" was not found in the object/)
          })
        })

        test('it indents the error stack more than the preceding warning message', () => {
          const COLUMN_COUNT = 2

          for(let i = 0; i < COLUMN_COUNT; i++) {
            expect(hasGreaterIndentation(consoleWarnCalls[i * 2][0], consoleWarnCalls[(i * 2) + 1][0])).toBe(true)
          }
        })
      })

      describe('when a column has invalid values', () => {
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.columnInvalidValues

          configValidator.validateConfig(configContents.toString())

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        describe('when "name" is of the wrong type', () => {
          test('warnings are printed with the index of the invalid column', () => {
            expect(consoleWarnCalls[0][0]).toMatch(/Could not make valid column from value at index: 0\. Skipping column\./)
            expect(consoleWarnCalls[1][0]).toMatch(/Member "name" was found not to be a string/)
          })
        })

        describe('when "labelingRules" is of the wrong type', () => {
          test('warnings are printed with the index of the invalid column', () => {
            expect(consoleWarnCalls[2][0]).toMatch(/Could not make valid column from value at index: 1\. Skipping column\./)
            expect(consoleWarnCalls[3][0]).toMatch(/Member "labelingRules" was found not to be an array/)
          })
        })

        describe('when "name" contains only whitespace', () => {
          test('warnings are printed with the index of the invalid column', () => {
            expect(consoleWarnCalls[4][0]).toMatch(/Could not make valid column from value at index: 2\. Skipping column\./)
            expect(consoleWarnCalls[5][0]).toMatch(/name must contain at least one non whitespace character/)
          })
        })

        describe('when "name" is empty string', () => {
          test('warnings are printed with the index of the invalid column', () => {
            expect(consoleWarnCalls[6][0]).toMatch(/Could not make valid column from value at index: 3\. Skipping column\./)
            expect(consoleWarnCalls[7][0]).toMatch(/name must contain at least one non whitespace character/)
          })
        })

        test('it indents the error stack more than the preceding warning message', () => {
          const COLUMN_COUNT = 4

          for(let i = 0; i < COLUMN_COUNT; i++) {
            expect(hasGreaterIndentation(consoleWarnCalls[i * 2][0], consoleWarnCalls[(i * 2) + 1][0])).toBe(true)
          }
        })
      })

      describe('when all of the labeling rules of a column are invalid', () => {
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.columnAllInvalidLabelingRules

          validatedConfig = configValidator.validateConfig(configContents.toString())!

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        describe('when the rule is missing both required keys', () => {
          test('warnings are printed with the index of the invalid labeling rule', () => {
            expect(consoleWarnCalls[0][0]).toMatch(/Could not make valid labeling rule from value at index: 0\. Skipping rule\./)
            expect(consoleWarnCalls[1][0]).toMatch(/key "[a-zA-Z]+" was not found in the object/)
          })
        })

        describe('when the rule is missing the "labels" key', () => {
          test('warnings are printed with the index of the invalid labeling rule', () => {
            expect(consoleWarnCalls[2][0]).toMatch(/Could not make valid labeling rule from value at index: 1\. Skipping rule\./)
            expect(consoleWarnCalls[3][0]).toMatch(/key "labels" was not found in the object/)
          })
        })

        describe('when the rule is missing the "action" key', () => {
          test('warnings are printed with the index of the invalid labeling rule', () => {
            expect(consoleWarnCalls[4][0]).toMatch(/Could not make valid labeling rule from value at index: 2\. Skipping rule\./)
            expect(consoleWarnCalls[5][0]).toMatch(/key "action" was not found in the object/)
          })
        })

        describe('when the value of "action" is not a string', () => {
          test('warnings are printed with the index of the invalid labeling rule', () => {
            expect(consoleWarnCalls[6][0]).toMatch(/Could not make valid labeling rule from value at index: 3\. Skipping rule\./)
            expect(consoleWarnCalls[7][0]).toMatch(/Member "action" was found not to be a string/)
          })
        })

        describe('when the value of "labels" is not an array', () => {
          test('warnings are printed with the index of the invalid labeling rule', () => {
            expect(consoleWarnCalls[8][0]).toMatch(/Could not make valid labeling rule from value at index: 4\. Skipping rule\./)
            expect(consoleWarnCalls[9][0]).toMatch(/Member "labels" was found not to be an array/)
          })
        })

        describe('when the value of "action" is not supported', () => {
          test('warnings are printed with the index of the invalid labeling rule', () => {
            expect(consoleWarnCalls[10][0]).toMatch(/Could not make valid labeling rule from value at index: 5\. Skipping rule\./)
            expect(consoleWarnCalls[11][0]).toMatch(/Labeling action ".+" is not supported. Supported actions are: \["ADD","REMOVE","SET"\]/)
          })
        })

        it('indents the error stack more than the preceding warning message', () => {
          const LABELING_RULE_COUNT = 6

          for(let i = 0; i < LABELING_RULE_COUNT; i++) {
            expect(hasGreaterIndentation(consoleWarnCalls[i * 2][0], consoleWarnCalls[(i * 2) + 1][0])).toBe(true)
          }
        })

        it('prints a warning that the column configuration will not be used', () => {
          expect(consoleWarnCalls[12][0]).toMatch(/Column with name:"column name" did not contain any valid labeling rules. Skipping column./)
        })

        it('will cause the validated config to be null because all columns are invalid', () => {
          expect(validatedConfig).toBe(null)
        })
      })

      describe('when all the labels of a labeling rule are invalid', () => {
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.labelingRulesInvalidLabels

          validatedConfig = configValidator.validateConfig(configContents.toString())!

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        describe('when the label is empty string', () => {
          test('warnings are printed with the index of the label', () => {
            expect(consoleWarnCalls[0][0]).toMatch(/Label at index: 0 must contain at least one non whitespace character\. Removing value\./)
          })
        })

        describe('when the label contains only white space', () => {
          test('warnings are printed with the index of the label', () => {
            expect(consoleWarnCalls[1][0]).toMatch(/Label at index: 1 must contain at least one non whitespace character\. Removing value\./)
          })
        })

        describe('when the label is not a string', () => {
          test('warnings are printed with the index of the label', () => {
            expect(consoleWarnCalls[2][0]).toMatch(/Label at index: 2 was found not to be a string\. Removing value\./)
          })
        })

        test('the parent labeling rule of the invalid labels does not appear in the validated config', () => {
          const { labelingRules } = validatedConfig.columns![0]

          expect(labelingRules.has(LabelingAction.ADD)).toBe(false)
        })

        test('a warning is printed stating that the labeling rule will not be used', () => {
          expect(consoleWarnCalls[3][0]).toMatch(/Labeling rule at index: 0 did not contain any valid labels\. Skipping rule\./)
        })
      })

      describe('when there are invalid parts of the config that are not required', () => {
        let validatedConfig: Config

        beforeAll(() => {
          const configContents = ConfigTestData.configInvalidNonEssentialSections

          validatedConfig = configValidator.validateConfig(configContents.toString())!
          console.log(JSON.stringify(validatedConfig, null, 2))
          console.log(validatedConfig.columns?.length)
        })

        it('will not contain the invalid project', () => {
          expect(validatedConfig.projects!.find((project) => {
            return project.projectKey.getName() === 'invalid project'
          })).toBe(undefined)
        })

        it('will contain the valid project', () => {
          expect(validatedConfig.projects!.find((project) => {
            return project.projectKey.getName() === 'valid project'
          })).not.toBe(undefined)
        })

        it('will not contain the invalid column', () => {
          const parentProject = validatedConfig.projects![0]

          expect(parentProject).toBeTruthy()

          expect(parentProject.columns.find((column) => {
            return column.name === 'invalid column'
          })).toBe(undefined)
        })

        it('will contain the valid column', () => {
          const parentProject = validatedConfig.projects![0]

          expect(parentProject).toBeTruthy()

          expect(parentProject.columns.find((column) => {
            return column.name === 'valid column'
          })).not.toBe(undefined)
        })

        it('will not contain the invalid labeling rule', () => {
          const parentProject = validatedConfig.projects![0]

          expect(parentProject).toBeTruthy()

          const parentColumn = parentProject.columns[0]

          expect(parentColumn).toBeTruthy()

          expect(Array.from(parentColumn.labelingRules.values()).find((labels) => {
            return labels.find((label) => {
              return isCaseInsensitiveEqual(label, 'invalid label 1') || isCaseInsensitiveEqual(label, 'invalid label 2')
            })
          })).toBe(undefined)
        })

        it('will contain the valid labeling rules', () => {
          const parentProject = validatedConfig.projects![0]

          expect(parentProject).toBeTruthy()

          const parentColumn = parentProject.columns[0]

          expect(parentColumn).toBeTruthy()

          expect(parentColumn.labelingRules.get(LabelingAction.ADD)).not.toBe(undefined)
          expect(parentColumn.labelingRules.get(LabelingAction.REMOVE)).not.toBe(undefined)
        })

        it('will not contain the invalid labels', () => {
          const parentProject = validatedConfig.projects![0]

          expect(parentProject).toBeTruthy()

          const parentColumn = parentProject.columns[0]

          expect(parentColumn).toBeTruthy()
          expect(parentColumn.labelingRules.size).toBeGreaterThan(0)

          const allLabels = Array.from(parentColumn.labelingRules.values()).reduce<string[]>((accumulator, currentVal) => {
            accumulator.push(...currentVal)

            return accumulator
          }, [])

          expect(allLabels.find((label) => {
            return label in {
              '': null,
              4: null,
              '     ': null
            }
          })).toBe(undefined)
        })

        it('will contain the valid labels', () => {const parentProject = validatedConfig.projects![0]

          expect(parentProject).toBeTruthy()

          const parentColumn = parentProject.columns[0]

          expect(parentColumn).toBeTruthy()
          expect(parentColumn.labelingRules.size).toBeGreaterThan(0)

          const allLabels = Array.from(parentColumn.labelingRules.values()).reduce<string[]>((accumulator, currentVal) => {
            accumulator.push(...currentVal)

            return accumulator
          }, [])

          expect(allLabels.find((label) => {
            return isCaseInsensitiveEqual(label, 'Completed')
          })).not.toBe(undefined)

          expect(allLabels.find((label) => {
            return isCaseInsensitiveEqual(label, 'Done')
          })).not.toBe(undefined)

          expect(allLabels.find((label) => {
            return isCaseInsensitiveEqual(label, 'Help Wanted')
          })).not.toBe(undefined)
        })
      })
    })*/
      })
    })
  })

  describe('getLabelingRules()', () => {
    describe('the container structure', () => {
      it('is a column name map with child labeling action maps with label array values when the config initialized with a json using columns', () => {
        const config = new Config(ConfigTestData.columnMinimal, logger)
        const labelingRules = config.getLabelingRules()
  
        expect(labelingRules).toBeInstanceOf(Map)
  
        for(const [key, value] of labelingRules.entries()) {
          expect(TypeChecker.isString(key)).toBe(true)
          expect(value).toBeInstanceOf(Map)

          for(const [childMapKey, childMapValue] of value) {
            expect(childMapKey in LabelingAction).toBe(true)
            expect(Array.isArray(childMapValue)).toBe(true)
          }
        }
      })

      it('is a project owner name map with child project number maps with child column maps(see above) when the config initialized with a json using projects', () => {
        const config = new Config(ConfigTestData.projectMinimal, logger)
        const labelingRules = config.getLabelingRules()
  
        expect(labelingRules).toBeInstanceOf(Map)
  
        for(const [key, value] of labelingRules.entries()) {// Project owner name map
          expect(TypeChecker.isString(key)).toBe(true)
          expect(value).toBeInstanceOf(Map)

          for(const [childMapKeyDepth1, childMapValueDepth1] of value) {// Project number map
            expect(typeof childMapKeyDepth1).toBe('number')
            expect(childMapValueDepth1 instanceof Map).toBe(true)

            for(const [childMapKeyDepth2, childMapValueDepth2] of childMapValueDepth1) {// Columns map
              expect(TypeChecker.isString(childMapKeyDepth2)).toBe(true)
              expect(childMapValueDepth2).toBeInstanceOf(Map)

              for(const [childMapKeyDepth3, childMapValueDepth3] of childMapValueDepth2) {// Labeling actions map
                expect(childMapKeyDepth3 as string in LabelingAction).toBe(true)
                expect(Array.isArray(childMapValueDepth3)).toBe(true)
              }
            }
          }
        }
      })
    })

    describe('trailing whitespace values', () => {
      describe('the github access token', () => {
        it('trims trailing whitespace', () => {
          throw new Error('unimplimented')
        })
      })

      describe('the repo owner', () => {
        it('trims trailing whitespace', () => {
          throw new Error('unimplimented')
        })
      })

      describe('the repo name', () => {
        it('trims trailing whitespace', () => {
          throw new Error('unimplimented')
        })
      })

      describe('project owner names', () => {
        it('trims trailing whitespace', () => {
          throw new Error('unimplimented')
        })
      })

      describe('column names', () => {
        it('trims trailing whitespace', () => {
          throw new Error('unimplimented')
        })
      })

      describe('labels', () => {
        it('trims trailing whitespace', () => {
        })
      })
    })

    describe('when the config has duplicates among its labeling rule arrays', () => {
      describe('duplicate projects', () => {

        let columnAAsymmetricName: string
        let columnASymmetricName: string
        let columnBAsymmetricName: string
        let columnBSymmetricName: string
        let columnCAsymmetricName: string
        let consoleInfoCalls: [message?: any, ...optionalParams: any[]][]
        let labelForColumnAAsymmetricAddAction: string
        let labelForColumnAAsymmetricRemoveAction: string
        let labelForColumnASymmetricAddActionA: string
        let labelForColumnASymmetricAddActionB: string
        let labelForColumnASymmetricAddActionC: string
        let labelForColumnASymmetricAddActionD: string
        let labelForColumnBAsymmetricRemoveActionE: string
        let labelForColumnBAsymmetricRemoveActionF: string
        let labelForColumnBAsymmetricRemoveActionG: string
        let labelForColumnBSymmetricOverridingA: string
        let labelForColumnCAsymmetricOverridingB: string
        let labelingRuleContainer: ProjectLabelingRuleContainer
        let projectDuplicateNameAndNumberName: string
        let projectDuplicateNameAndNumberNumber: number
        let projectDuplicateNameOnlyName: string

        beforeAll(() => {
          resetSpies()
          const configInputJSONString = ConfigTestData.projectDuplicatesWithDuplicateChildren
          const configInputJSON = JSON.parse(configInputJSONString)

          columnAAsymmetricName = configInputJSON.projects[1].columns[1].name.toLocaleLowerCase()
          columnASymmetricName = configInputJSON.projects[1].columns[0].name.toLocaleLowerCase()
          columnBAsymmetricName = configInputJSON.projects[3].columns[1].name.toLocaleLowerCase()
          columnBSymmetricName = configInputJSON.projects[3].columns[0].name.toLocaleLowerCase()
          columnCAsymmetricName = configInputJSON.projects[3].columns[3].name.toLocaleLowerCase()
          consoleInfoCalls = consoleLoggingFunctionSpies.info.mock.calls
          labelForColumnAAsymmetricAddAction = configInputJSON.projects[1].columns[2].labelingActions[0].labels[0]
          labelForColumnAAsymmetricRemoveAction = configInputJSON.projects[1].columns[1].labelingActions[0].labels[0]
          labelForColumnASymmetricAddActionA = configInputJSON.projects[0].columns[0].labelingActions[0].labels[0]
          labelForColumnASymmetricAddActionB = configInputJSON.projects[1].columns[0].labelingActions[0].labels[0]
          labelForColumnASymmetricAddActionC = configInputJSON.projects[0].columns[0].labelingActions[0].labels[1]
          labelForColumnASymmetricAddActionD = configInputJSON.projects[1].columns[0].labelingActions[0].labels[1]
          labelForColumnBAsymmetricRemoveActionE = configInputJSON.projects[3].columns[2].labelingActions[0].labels[1]
          labelForColumnBAsymmetricRemoveActionF = configInputJSON.projects[3].columns[2].labelingActions[0].labels[0]
          labelForColumnBAsymmetricRemoveActionG = configInputJSON.projects[3].columns[1].labelingActions[0].labels[0]
          labelForColumnBSymmetricOverridingA = configInputJSON.projects[3].columns[0].labelingActions[0].labels[0]
          labelForColumnCAsymmetricOverridingB = configInputJSON.projects[3].columns[4].labelingActions[0].labels[0]
          projectDuplicateNameAndNumberName = configInputJSON.projects[0].ownerLogin.toLocaleLowerCase()
          projectDuplicateNameAndNumberNumber = configInputJSON.projects[0].number
          projectDuplicateNameOnlyName = configInputJSON.projects[2].ownerLogin.toLocaleLowerCase()
  
          const config = new Config(configInputJSONString, logger)
          labelingRuleContainer = config.getLabelingRules() as ProjectLabelingRuleContainer
        })

        it('includes each unique project name', () => {
          throw new Error('unimplimented')
        })

        it('places each project number under the correct project name', () => {
          throw new Error('unimplimented')
        })

        describe('when there are duplicate projects without numbers sharing names', () => {
          it('merges their child columns', () => {
            expect(labelingRuleContainer.get(projectDuplicateNameOnlyName)?.get(0)?.has(columnBAsymmetricName)).toBe(true)
            expect(labelingRuleContainer.get(projectDuplicateNameOnlyName)?.get(0)?.has(columnBSymmetricName)).toBe(true)
          })
        })

        describe('when there are duplicate projects sharing names and numbers', () => {
          it('merges their child columns', () => {
            expect(labelingRuleContainer.get(projectDuplicateNameAndNumberName)?.get(projectDuplicateNameAndNumberNumber)?.has(columnAAsymmetricName)).toBe(true)
            expect(labelingRuleContainer.get(projectDuplicateNameAndNumberName)?.get(projectDuplicateNameAndNumberNumber)?.has(columnASymmetricName)).toBe(true)
          })
        })

        describe('duplicate child columns', () => {
          it('includes each unique column name under the correct project number', () => {
            throw new Error('unimplimented')
          })

          describe('child labeling action merges', () => {
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
                throw new Error('unimplimneted')
              })

              it('prints an error upon removing a conflicting pair of labels', () => {
                throw new Error('unimplimneted')
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
                expect(mergedLabels?.slice().sort()).toEqual([labelForColumnBAsymmetricRemoveActionE, labelForColumnBAsymmetricRemoveActionF, labelForColumnBAsymmetricRemoveActionG].sort())
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
                const labelingRuleIndexMessageIndex = consoleInfoCalls.findIndex((consoleArgs) => {
                  return /Found SET labeling rule at index: 2/.test(consoleArgs[0])
                })
      
                const labelingRuleDeterminationMessageIndex = consoleInfoCalls.findIndex((consoleArgs) => {
                  return /The column will be using only this rule/.test(consoleArgs[0])
                })
      
                expect(labelingRuleIndexMessageIndex).not.toBe(-1)
                expect(labelingRuleDeterminationMessageIndex).not.toBe(-1)
                expect(labelingRuleIndexMessageIndex).toBeLessThan(labelingRuleDeterminationMessageIndex)
                expect(hasGreaterIndentation(consoleInfoCalls[labelingRuleIndexMessageIndex][0], consoleInfoCalls[labelingRuleDeterminationMessageIndex][0])).toBe(true)
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
})