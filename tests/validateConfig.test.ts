import fs from 'fs'
import ConfigTestData from './data/configTestData'
import ConfigValidator from '../src/validateConfig'
import { Logger } from '../src/logger'
import { Column, Config, LabelingAction, Project, isShallowColumnPOJO } from '../src/configObjects'
import { caseInsensitiveCompare, hasTrailingWhitespace, isCaseInsensitiveEqual } from '../src/util'

const logger = new Logger()
const configValidator = new ConfigValidator(logger)

function countSpaceIndentationOfLoggerMessage (text: string): number {
  return text.slice(11).search(/\S/)
}

function hasGreaterIndentation (expectedLesserIndentationMessage: string, expectedGreaterIndentationMessage: string): boolean {
  return countSpaceIndentationOfLoggerMessage(expectedGreaterIndentationMessage) - countSpaceIndentationOfLoggerMessage(expectedLesserIndentationMessage) === 2
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

describe('validateConfig()', () => {
  describe('when config contains invalid json', () => {
    let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
    let validatedConfig: Config | null

    beforeAll(() => {
      resetSpies()
      const configContents = ConfigTestData.invalidJSON

      validatedConfig = configValidator.validateConfig(configContents.toString())

      consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
    })

    it('returns null', () => {
      expect(validatedConfig).toBe(null)
    })

    it('prints an error describing why the config is invalid', () => {
      expect(consoleErrorCalls.find((consoleErrorCall) => {
        return /Could not parse config as JSON/.test(consoleErrorCall[0])
      })).not.toBe(undefined)
    })
  })

  describe('when config is missing a required key', () => {
    let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
    let validatedConfig: Config | null

    beforeAll(() => {
      resetSpies()
      const configContents = ConfigTestData.configMissingKey

      validatedConfig = configValidator.validateConfig(configContents.toString())

      consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
    })

    it('returns null', () => {
      expect(validatedConfig).toBe(null)
    })

    it('prints an error describing why the config is invalid', () => {
      expect(consoleErrorCalls.find((consoleErrorCall) => {
        return /key "accessToken" was not found in the object/.test(consoleErrorCall[0])
      })).not.toBe(undefined)
    })
  })

  describe('when the config contains all required keys', () => {
    describe('when the github access token is of the wrong type', () => {
      let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
      let validatedConfig: Config | null

      beforeAll(() => {
        resetSpies()
        const configContents = ConfigTestData.configWrongTypeAccessToken

        validatedConfig = configValidator.validateConfig(configContents.toString())

        consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
      })

      it('returns null', () => {
        expect(validatedConfig).toBe(null)
      })

      it('prints an error describing why the config is invalid', () => {
        expect(consoleErrorCalls.find((consoleErrorCall) => {
          return /Member "accessToken" was found not to be a string/.test(consoleErrorCall[0])
        })).not.toBe(undefined)
      })
    })

    describe('when the github access token contains only whitespace', () => {
      let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
      let validatedConfig: Config | null

      beforeAll(() => {
        resetSpies()
        const configContents = ConfigTestData.configWhiteSpaceOnlyAccessToken

        validatedConfig = configValidator.validateConfig(configContents.toString())

        consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
      })

      it('returns null', () => {
        expect(validatedConfig).toBe(null)
      })

      it('prints an error describing why the config is invalid', () => {
        expect(consoleErrorCalls.find((consoleErrorCall) => {
          return /The github access token cannot be empty or contain only whitespace/.test(consoleErrorCall[0])
        })).not.toBe(undefined)
      })
    })

    describe('when the repo is of the wrong type', () => {
      let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
      let validatedConfig: Config | null

      beforeAll(() => {
        resetSpies()
        const configContents = ConfigTestData.configWrongTypeRepo

        validatedConfig = configValidator.validateConfig(configContents.toString())

        consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
      })

      it('returns null', () => {
        expect(validatedConfig).toBe(null)
      })

      it('prints an error describing why the config is invalid', () => {
        expect(consoleErrorCalls.find((consoleErrorCall) => {
          return /Member "repo" was found not to be an object/.test(consoleErrorCall[0])
        })).not.toBe(undefined)
      })
    })

    describe('repo', () => {
      describe('when the repo owner is not a string', () => {
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config | null

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.repoWrongTypeOwnerName

          validatedConfig = configValidator.validateConfig(configContents.toString())

          consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
        })

        it('returns null', () => {
          expect(validatedConfig).toBe(null)
        })

        it('prints an error describing why the config is invalid', () => {
          expect(consoleErrorCalls.find((consoleErrorCall) => {
            return /Member "ownerName" was found not to be a string/.test(consoleErrorCall[0])
          })).not.toBe(undefined)
        })
      })

      describe('when the repo owner contains only whitespace', () => {
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config | null

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.repoWhitespaceOnlyOwnerName

          validatedConfig = configValidator.validateConfig(configContents.toString())

          consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
        })

        it('returns null', () => {
          expect(validatedConfig).toBe(null)
        })

        it('prints an error describing why the config is invalid', () => {
          expect(consoleErrorCalls.find((consoleErrorCall) => {
            return /ownerName must contain at least one non whitespace character/.test(consoleErrorCall[0])
          })).not.toBe(undefined)
        })
      })

      describe('when the repo name is not a string', () => {
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config | null

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.repoWrongTypeName

          validatedConfig = configValidator.validateConfig(configContents.toString())

          consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
        })

        it('returns null', () => {
          expect(validatedConfig).toBe(null)
        })

        it('prints an error describing why the config is invalid', () => {
          expect(consoleErrorCalls.find((consoleErrorCall) => {
            return /Member "name" was found not to be a string/.test(consoleErrorCall[0])
          })).not.toBe(undefined)
        })
      })

      describe('when the repo name contains only whitespace', () => {
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config | null

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.repoWhitespaceOnlyName

          validatedConfig = configValidator.validateConfig(configContents.toString())

          consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
        })

        it('returns null', () => {
          expect(validatedConfig).toBe(null)
        })

        it('prints an error describing why the config is invalid', () => {
          expect(consoleErrorCalls.find((consoleErrorCall) => {
            return /name must contain at least one non whitespace character/.test(consoleErrorCall[0])
          })).not.toBe(undefined)
        })
      })
    })

    describe('projects', () => {
      describe('when projects is not an array', () => {
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config | null

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.configWrongTypeProjects

          validatedConfig = configValidator.validateConfig(configContents.toString())

          consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
        })

        it('returns null', () => {
          expect(validatedConfig).toBe(null)
        })

        it('prints an error describing why the config is invalid', () => {
          expect(consoleErrorCalls.find((consoleErrorCall) => {
            return /Member "projects" was found not to be an array/.test(consoleErrorCall[0])
          })).not.toBe(undefined)
        })
      })

      describe('when a project is not an object', () => {
        const PROJECTS_COUNT = 3
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.projectArrayValuesWrongType

          configValidator.validateConfig(configContents.toString())

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        test('it prints warnings with the index of the invalid element', () => {
          for (let i = 0; i < PROJECTS_COUNT; i++) {
            expect(consoleWarnCalls[i * 2][0]).toMatch(new RegExp(`Could not make valid project from value at index: ${i}\\. Skipping project\\.`))
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
          const configContents = ConfigTestData.projectMissingRequiredKey

          configValidator.validateConfig(configContents.toString())

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        describe('when "columns" is missing', () => {
          test('warnings are printed with the index of the invalid project', () => {
            expect(consoleWarnCalls[0][0]).toMatch(/Could not make valid project from value at index: 0\. Skipping project\./)
            expect(consoleWarnCalls[1][0]).toMatch(/key "columns" was not found in the object/)
          })
        })

        describe('when "ownerLogin" is missing', () => {
          test('warnings are printed with the index of the invalid project', () => {
            expect(consoleWarnCalls[2][0]).toMatch(/Could not make valid project from value at index: 1\. Skipping project\./)
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
          const configContents = ConfigTestData.projectInvalidValues

          configValidator.validateConfig(configContents.toString())

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        describe('when "columns" is of the wrong type', () => {
          test('warnings are printed with the index of the invalid project', () => {
            expect(consoleWarnCalls[0][0]).toMatch(/Could not make valid project from value at index: 0\. Skipping project\./)
            expect(consoleWarnCalls[1][0]).toMatch(/Member "columns" was found not to be an array/)
          })
        })

        describe('when "number" is of the wrong type', () => {
          test('warnings are printed with the index of the invalid project', () => {
            expect(consoleWarnCalls[2][0]).toMatch(/Could not make valid project from value at index: 1\. Skipping project\./)
            expect(consoleWarnCalls[3][0]).toMatch(/Member "number" was found not to be a number/)
          })
        })

        describe('when "number" is less than 1', () => {
          test('warnings are printed with the index of the invalid project', () => {
            expect(consoleWarnCalls[4][0]).toMatch(/Could not make valid project from value at index: 2\. Skipping project\./)
            expect(consoleWarnCalls[5][0]).toMatch(/Number must be greater than 0/)
          })
        })

        describe('when "number" is not an integer', () => {
          test('warnings are printed with the index of the invalid project', () => {
            expect(consoleWarnCalls[6][0]).toMatch(/Could not make valid project from value at index: 3\. Skipping project\./)
            expect(consoleWarnCalls[7][0]).toMatch(/Number must be an integer/)
          })
        })

        describe('when "ownerLogin" is of the wrong type', () => {
          test('warnings are printed with the index of the invalid project', () => {
            expect(consoleWarnCalls[8][0]).toMatch(/Could not make valid project from value at index: 4\. Skipping project\./)
            expect(consoleWarnCalls[9][0]).toMatch(/Member "ownerLogin" was found not to be a string/)
          })
        })

        describe('when "ownerLogin" contains only whitespace', () => {
          test('warnings are printed with the index of the invalid project', () => {
            expect(consoleWarnCalls[10][0]).toMatch(/Could not make valid project from value at index: 5\. Skipping project\./)
            expect(consoleWarnCalls[11][0]).toMatch(/ownerLogin must contain at least one non whitespace character/)
          })
        })

        describe('when "ownerLogin" is empty string', () => {
          test('warnings are printed with the index of the invalid project', () => {
            expect(consoleWarnCalls[12][0]).toMatch(/Could not make valid project from value at index: 6\. Skipping project\./)
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

      describe('when there are duplicate projects without numbers sharing names', () => {
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.projectDuplicatesNameOnly

          validatedConfig = configValidator.validateConfig(configContents.toString())!

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        test('only one project with the name remains in the validated config', () => {
          expect(validatedConfig.projects!.filter((project) => {
            return project.projectKey.getName() === 'duplicate project name'
          }).length).toBe(1)
        })

        test('duplicate children of the projects are merged', () => {
          const duplicateProject = validatedConfig.projects![0]
          const duplicateColumnsSearchOfDuplicateProject = duplicateProject.columns.filter((column) => {
            return column.name === 'duplicate column name'
          })

          expect(duplicateColumnsSearchOfDuplicateProject.length).toBe(1)
          expect(duplicateProject.columns.find((column) => {
            return column.name === 'non duplicate column name'
          })).not.toBe(undefined)

          const duplicateColumn = duplicateColumnsSearchOfDuplicateProject[0]
          const duplicateLabels = duplicateColumn.labelingRules.get(LabelingAction.ADD)
          expect(duplicateLabels).not.toBe(undefined)

          expect(duplicateLabels!.find((label) => {
            return label === 'label 1'
          })).not.toBe(undefined)
          expect(duplicateLabels!.find((label) => {
            return label === 'label 2'
          })).not.toBe(undefined)
          expect(duplicateLabels!.find((label) => {
            return label === 'label 3'
          })).not.toBe(undefined)
        })

        test('messages are printed out about the duplicate merging', () => {
          expect(consoleWarnCalls.find((consoleArgs) => {
            return /Found multiple columns with name:"duplicate column name"\. Combining labeling rules\./.test(consoleArgs[0])
          })).not.toBe(undefined)

          expect(consoleWarnCalls.find((consoleArgs) => {
            return /Found multiple projects with owner:"duplicate project name" and number:null\. Combining columns\./.test(consoleArgs[0])
          })).not.toBe(undefined)
        })
      })

      describe('when there are duplicate projects sharing names and numbers', () => {
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.projectDuplicatesNameAndNumber

          validatedConfig = configValidator.validateConfig(configContents.toString())!

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        test('only one project with the name and number remains in the validated config', () => {
          expect(validatedConfig.projects!.filter((project) => {
            return project.projectKey.getName() === 'duplicate project name' && project.projectKey.getNumber() === 1
          }).length).toBe(1)
        })

        test('columns are combined between the duplicate projects', () => {
          const duplicateProject = validatedConfig.projects![0]

          expect(duplicateProject.columns.filter((column) => {
            return column.name === 'column 1'
          }).length).toBe(1)

          expect(duplicateProject.columns.filter((column) => {
            return column.name === 'column 2'
          }).length).toBe(1)
        })

        test('messages are printed out about the duplicate merging', () => {
          expect(consoleWarnCalls.find((consoleArgs) => {
            return /Found multiple projects with owner:"duplicate project name" and number:1\. Combining columns\./.test(consoleArgs[0])
          })).not.toBe(undefined)
        })
      })

      describe('when there are projects sharing names but not numbers', () => {
        let validatedConfig: Config

        beforeAll(() => {
          const configContents = ConfigTestData.projectDuplicatesNameButNotNumber

          validatedConfig = configValidator.validateConfig(configContents.toString())!
        })

        test('the projects are not considered duplicates', () => {
          const projects = validatedConfig.projects!

          expect(projects.filter((project) => {
            return project.projectKey.getName() === 'duplicate project name' && project.projectKey.getNumber() === 1
          }).length).toBe(1)

          expect(projects.filter((project) => {
            return project.projectKey.getName() === 'duplicate project name' && project.projectKey.getNumber() === 2
          }).length).toBe(1)
        })
      })

      describe('when there are projects sharing numbers but not names', () => {
        let validatedConfig: Config

        beforeAll(() => {
          const configContents = ConfigTestData.projectDuplicatesNumberButNotName

          validatedConfig = configValidator.validateConfig(configContents.toString())!
        })

        test('the projects are not considered duplicates', () => {
          const projects = validatedConfig.projects!

          expect(projects.filter((project) => {
            return project.projectKey.getName() === 'project name' && project.projectKey.getNumber() === 1
          }).length).toBe(1)

          expect(projects.filter((project) => {
            return project.projectKey.getName() === 'different project name' && project.projectKey.getNumber() === 1
          }).length).toBe(1)
        })
      })
    })

    describe('columns', () => {
      describe('when columns is not an array', () => {
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config | null

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.configWrongTypeColumns

          validatedConfig = configValidator.validateConfig(configContents.toString())

          consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
        })

        it('returns null', () => {
          expect(validatedConfig).toBe(null)
        })

        it('prints an error describing why the config is invalid', () => {
          expect(consoleErrorCalls.find((consoleErrorCall) => {
            return /Member "columns" was found not to be an array/.test(consoleErrorCall[0])
          })).not.toBe(undefined)
        })
      })

      describe('when a column is not an object', () => {
        const COLUMN_COUNT = 3
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.columnArrayValuesWrongType

          configValidator.validateConfig(configContents.toString())

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        test('it prints warnings with the index of the invalid element', () => {
          for (let i = 0; i < COLUMN_COUNT; i++) {
            expect(consoleWarnCalls[i * 2][0]).toMatch(new RegExp(`Could not make valid column from value at index: ${i}\\. Skipping column\\.`))
            expect(consoleWarnCalls[(i * 2) + 1][0]).toMatch(/Column must be an object/)
          }
        })

        test('it indents the error stack more than the preceding warning message', () => {
          for (let i = 0; i < COLUMN_COUNT; i++) {
            expect(hasGreaterIndentation(consoleWarnCalls[i * 2][0], consoleWarnCalls[(i * 2) + 1][0])).toBe(true)
          }
        })
      })

      describe('when the column is missing a required key', () => {
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

      describe('when there are duplicate column names', () => {
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.columnDuplicateNames

          validatedConfig = configValidator.validateConfig(configContents.toString())!

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        test('labeling rules are combined between the duplicates', () => {
          const column = validatedConfig.columns![0]

          expect(column).toBeTruthy()

          const addRuleLabels = column.labelingRules.get(LabelingAction.ADD)
          const removeRuleLabels = column.labelingRules.get(LabelingAction.REMOVE)

          expect(addRuleLabels).not.toBe(undefined)
          expect(removeRuleLabels).not.toBe(undefined)

          expect(addRuleLabels).toContain('Label1')
          expect(removeRuleLabels).toContain('Label2')
        })

        test('a message is printed about the labeling rule merge', () => {
          expect(consoleWarnCalls.find((consoleArgs) => {
            return /Found multiple columns with name:"duplicate name"\. Combining labeling rules\./.test(consoleArgs[0])
          })).not.toBe(undefined)
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

      describe('when there are multiple labeling rules with a "SET" action', () => {
        let consoleInfoCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.labelingRulesActionOrderPrecedence

          validatedConfig = configValidator.validateConfig(configContents.toString())!

          consoleInfoCalls = consoleLoggingFunctionSpies.info.mock.calls
        })

        test('only the last labeling rule with a "SET" action appears in the validated config', () => {
          expect(validatedConfig.columns!.length).toBe(1)
          expect(validatedConfig.columns![0].labelingRules.size).toBe(1)
          expect(validatedConfig.columns![0].labelingRules.has(LabelingAction.SET)).toBe(true)
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

      describe('when there is a labeling rule with a "SET" action and other rules with different actions', () => {
        let consoleInfoCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.lableingRulesActionTypePrecedence

          validatedConfig = configValidator.validateConfig(configContents.toString())!

          consoleInfoCalls = consoleLoggingFunctionSpies.info.mock.calls
        })

        test('only the labeling rule with a "SET" action appears in the validated config', () => {
          expect(validatedConfig.columns!.length).toBe(1)
          expect(validatedConfig.columns![0].labelingRules.size).toBe(1)
          expect(validatedConfig.columns![0].labelingRules.has(LabelingAction.SET)).toBe(true)
        })

        test('a warning is printed stating that only SET rule will be used', () => {
          const labelingRuleIndexMessageIndex = consoleInfoCalls.findIndex((consoleArgs) => {
            return /Found SET labeling rule at index: 1/.test(consoleArgs[0])
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

      describe('when a column does not contain SET labeling rules', () => {
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.columnLabelDuplicationAndUnsortedAddRemoveActions

          validatedConfig = configValidator.validateConfig(configContents.toString())!

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        describe('when there are multiple ADD labeling rules', () => {
          let addRuleLabels: string[] | undefined

          beforeAll(() => {
            addRuleLabels = validatedConfig.columns![0].labelingRules.get(LabelingAction.ADD)
          })

          test('all of the unique labels between all of the ADD rules are combined under a single rule', () => {
            expect(addRuleLabels).not.toBe(undefined)
            expect(addRuleLabels?.length).toBe(3)
          })

          test('the lables of the ADD rule are sorted alphabetically', () => {
            expect(addRuleLabels?.findIndex((label) => {
              return isCaseInsensitiveEqual(label, 'Duplicate Label')
            })).toBe(0)

            expect(addRuleLabels?.findIndex((label) => {
              return isCaseInsensitiveEqual(label, 'Help Wanted')
            })).toBe(1)

            expect(addRuleLabels?.findIndex((label) => {
              return isCaseInsensitiveEqual(label, 'New')
            })).toBe(2)
          })
        })

        describe('when there are multiple REMOVE labeling rules', () => {
          let removeRuleLabels: string[] | undefined

          beforeAll(() => {
            removeRuleLabels = validatedConfig.columns![0].labelingRules.get(LabelingAction.REMOVE)
          })

          afterAll(() => {
            resetSpies()
          })

          test('all of the unique labels between all of the REMOVE rules are combined under a single rule', () => {
            expect(removeRuleLabels).not.toBe(undefined)
            expect(removeRuleLabels!.length).toBe(3)
          })

          test('the lables of the REMOVE rule are sorted alphabetically', () => {
            expect(removeRuleLabels?.findIndex((label) => {
              return isCaseInsensitiveEqual(label, 'Completed')
            })).toBe(0)

            expect(removeRuleLabels?.findIndex((label) => {
              return isCaseInsensitiveEqual(label, 'Completed 1')
            })).toBe(1)

            expect(removeRuleLabels?.findIndex((label) => {
              return isCaseInsensitiveEqual(label, 'Duplicate emoji 🐌')
            })).toBe(2)
          })
        })

        describe('when an ADD and REMOVE rule contain the same label', () => {
          beforeAll(() => {
            resetSpies()
            const configContents = ConfigTestData.labelingRulesConflict

            validatedConfig = configValidator.validateConfig(configContents.toString())!

            consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
          })

          test('the label does not appear in the validated config', () => {
            const column = validatedConfig.columns![0]
            const addRuleLabels = column.labelingRules.get(LabelingAction.ADD)
            const removeRuleLabels = column.labelingRules.get(LabelingAction.REMOVE)

            if (addRuleLabels && removeRuleLabels) {
              expect(addRuleLabels?.length).toBe(1)
              expect(removeRuleLabels?.length).toBe(1)

              for(let label of addRuleLabels) {
                expect(removeRuleLabels.find((removeLabel) => { return isCaseInsensitiveEqual(label, removeLabel) })).toBe(undefined)
              }
            }
          })

          test('a warning is printed stating that the label will be removed from both rules', () => {
            expect(consoleWarnCalls[0][0]).toMatch(/Found same label: "ambiguous label conflict" in both ADD and REMOVE labeling rules\. Removing label\./)
          })
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

      describe('when there are many labels for a labeling action', () => {
        describe('for ADD and REMOVE actions', () => {
          let validatedConfig: Config

          beforeAll(() => {
            const configContents = ConfigTestData.columnLabelDuplicationAndUnsortedAddRemoveActions

            validatedConfig = configValidator.validateConfig(configContents.toString())!
          })

          it('removes the duplicates', () => {
            const parentColumn = validatedConfig.columns![0]
            const sortedAddLabels = parentColumn.labelingRules.get(LabelingAction.ADD)
            const sortedRemoveLabels = parentColumn.labelingRules.get(LabelingAction.REMOVE)

            expect(sortedAddLabels).not.toBe(undefined)
            expect(sortedRemoveLabels).not.toBe(undefined)

            expect(sortedRemoveLabels!.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'Completed')
            }).length).toBe(1)

            expect(sortedRemoveLabels!.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'Completed 1')
            }).length).toBe(1)

            expect(sortedAddLabels!.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'Duplicate Label')
            }).length).toBe(1)

            expect(sortedRemoveLabels!.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'Duplicate emoji 🐌')
            }).length).toBe(1)

            expect(sortedAddLabels!.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'Help Wanted')
            }).length).toBe(1)

            expect(sortedAddLabels!.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'New')
            }).length).toBe(1)
          })

          it('sorts the labels alphabetically', () => {
            const parentColumn = validatedConfig.columns![0]

            expect(Array.from(parentColumn.labelingRules.values()).find((labels) => {
              return labels.length > 1
            })).not.toBeFalsy()

            for (let labels of parentColumn.labelingRules.values()) {
              expect(labels.length).toBeGreaterThan(1)

              for (let i = 0; i < labels.length - 1; i++) {
                expect(caseInsensitiveCompare(labels[i], labels[i + 1])).toBe(-1)
              }
            }
          })
        })

        describe('for a SET action', () => {
          let validatedConfig: Config

          beforeAll(() => {
            const configContents = ConfigTestData.labelingRulesSetActionAndDuplicateLabels

            validatedConfig = configValidator.validateConfig(configContents.toString())!
          })

          it('removes the duplicates', () => {
            const parentColumn = validatedConfig.columns![0]
            const labels = parentColumn.labelingRules.get(LabelingAction.SET)

            expect(labels).not.toBeFalsy()

            expect(labels!.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'Duplicate Label')
            }).length).toBe(1)

            expect(labels!.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'Help Wanted')
            }).length).toBe(1)

            expect(labels!.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'New')
            }).length).toBe(1)
          })

          it('sorts the labels alphabetically', () => {
            const parentColumn = validatedConfig.columns![0]
            const labels = parentColumn.labelingRules.get(LabelingAction.SET)

            expect(labels).toBeTruthy()
            expect(labels!.length).toBeGreaterThan(1)

            for (let i = 0; i < labels!.length - 1; i++) {
              expect(caseInsensitiveCompare(labels![i], labels![i + 1])).toBe(-1)
            }
          })
        })
      })
    })

    describe('trailing whitespace values', () => {
      let validatedConfig: Config

      beforeAll(() => {
        const configContents = ConfigTestData.configTrailingWhitespaceValues

        validatedConfig = configValidator.validateConfig(configContents.toString())!
      })

      describe('the github access token', () => {
        it('does not contain trailing whitespace', () => {
          expect(hasTrailingWhitespace(validatedConfig.accessToken)).toBeFalsy()
        })
      })

      describe('the repo owner', () => {
        it('does not contain trailing whitespace', () => {
          expect(hasTrailingWhitespace(validatedConfig.repo.ownerName)).toBeFalsy()
        })
      })

      describe('the repo name', () => {
        it('does not contain trailing whitespace', () => {
          expect(hasTrailingWhitespace(validatedConfig.repo.name)).toBeFalsy()
        })
      })

      describe('projects', () => {
        describe('the project owner login name', () => {
          it('does not contain trailing whitespace', () => {
            const { projects } = validatedConfig

            expect(projects!.length).toBeGreaterThan(0)

            for(let project of projects!) {
              expect(hasTrailingWhitespace(project.projectKey.getName())).toBe(false)
            }
          })
        })

        describe('columns', () => {
          let columns: Column[]

          beforeAll(() => {
            columns = validatedConfig.projects![0].columns
          })

          describe('the column name', () => {
            it('does not contain trailing whitespace', () => {

              expect(columns.length).toBeGreaterThan(0)

              for(let column of columns!) {
                expect(hasTrailingWhitespace(column.name)).toBe(false)
              }
            })
          })
        })
      })
    })

    describe('a normal config', () => {
      let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
      let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]
      let validatedConfig: Config

      beforeAll(() => {
        resetSpies()
        const configContents = ConfigTestData.configNormal

        validatedConfig = configValidator.validateConfig(configContents.toString())!

        consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
        consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
      })

      it('does not print warnings', () => {
        expect(consoleWarnCalls.length).toBe(0)
      })

      it('does not print errors', () => {
        expect(consoleErrorCalls.length).toBe(0)
      })

      describe('the config information', () => {
        it('includes the access key', () => {
          expect(validatedConfig.accessToken).toBe('access token')
        })

        it('includes the repo owner', () => {
          expect(validatedConfig.repo.ownerName).toBe('repo owner')
        })

        it('includes the repo name', () => {
          expect(validatedConfig.repo.name).toBe('repo name')
        })

        describe('projects', () => {
          let projects: Project[]

          beforeAll(() => {
            projects = validatedConfig.projects!
          })

          it ('includes the whole project', () => {
            expect(projects.length).toBe(1)

            const project = projects[0]

            expect(project.projectKey.getNumber()).toBe(2)
            expect(project.projectKey.getName()).toBe('githubOrganizationName')
          })

          describe('columns', () => {
            let columns: Column[]
            let toDoColumn: Column | undefined
            let completedColumn: Column | undefined

            beforeAll(() => {
              columns = projects[0].columns
            })

            it('includes all columns', () => {
              toDoColumn = columns.find((column) => {
                return column.name === 'to do'
              })

              completedColumn = columns.find((column) => {
                return column.name === 'completed'
              })

              expect(toDoColumn).not.toBe(undefined)
              expect(completedColumn).not.toBe(undefined)
            })

            describe('the labeling rules', () => {
              let toDoAddLabels: string[] | undefined
              let toDoRemoveLabels: string[] | undefined
              let completedRemoveLabels: string[] | undefined

              it('includes the correct labeling rule(s) for each column', () => {
                expect(toDoColumn).not.toBe(undefined)

                toDoAddLabels = toDoColumn!.labelingRules.get(LabelingAction.ADD)
                toDoRemoveLabels = toDoColumn!.labelingRules.get(LabelingAction.REMOVE)

                expect(toDoAddLabels).not.toBe(undefined)
                expect(toDoRemoveLabels).not.toBe(undefined)

                expect(completedColumn).not.toBe(undefined)
                completedRemoveLabels = completedColumn!.labelingRules.get(LabelingAction.REMOVE)

                expect(completedRemoveLabels).not.toBe(undefined)
              })

              it('includes the correct labels for each labeling rule', () => {
                if (toDoAddLabels) {
                  expect(toDoAddLabels.includes('hacktoberfest')).toBe(true)
                  expect(toDoAddLabels.includes('todo')).toBe(true)
                  expect(toDoAddLabels.includes('help wanted')).toBe(true)
                }

                if (toDoRemoveLabels) {
                  expect(toDoRemoveLabels.includes('Completed')).toBe(true)
                  expect(toDoRemoveLabels.includes('🐌')).toBe(true)
                }

                if (completedRemoveLabels) {
                  expect(completedRemoveLabels.includes('hacktoberfest')).toBe(true)
                  expect(completedRemoveLabels.includes('todo')).toBe(true)
                  expect(completedRemoveLabels.includes('help wanted')).toBe(true)
                }
              })
            })
          })
        })
      })
    })
  })
})
