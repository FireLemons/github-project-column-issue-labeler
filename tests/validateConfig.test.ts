import fs from 'fs'
import validateConfig from '../src/validateConfig'

const fsPromises = fs.promises

function countSpaceIndentationOfLoggerMessage (text: string): number {
  return text.slice(11).search(/\S/)
}

function hasGreaterIndentation (expectedLesserIndentationMessage: string, expectedGreaterIndentationMessage: string): boolean {
  return countSpaceIndentationOfLoggerMessage(expectedGreaterIndentationMessage) - countSpaceIndentationOfLoggerMessage(expectedLesserIndentationMessage) === 2
}

describe('validateConfig()', () => {
  describe('when config contains invalid json', () => {
    test('it throws an error with a message describing that the file did not contain parsable JSON', async () => {
      const configContents = await fsPromises.readFile('./tests/configInvalidJSON.json')

      expect(() => {
        validateConfig(configContents.toString())
      }).toThrow(new SyntaxError('Could not parse config as JSON'))
    })
  })

  describe('when config is missing a required key', () => {
    test('it throws an error with a message describing that the file is missing a required key', async () => {
      const configContents = await fsPromises.readFile('./tests/configMissingKey.json')

      expect(() => {
        validateConfig(configContents.toString())
      }).toThrow(new ReferenceError(`key "access-token" was not found in the object`))
    })
  })

  describe('when the config contains all required keys', () => {
    describe('when the github access token is not a string', () => {
      test('it throws a TypeError specifying the correct type for the github access token', async () => {
        const configContents = await fsPromises.readFile('./tests/configWrongTypeGithubAccessToken.json')
  
        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "access-token" was found not to be a string`))
      })
    })

    describe('when the github access token contains only whitespace', () => {
      test('it throws a RangeError', async () => {
        const configContents = await fsPromises.readFile('./tests/configEmptyGithubAccessToken.json')
  
        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new RangeError('The github access token cannot be empty or contain only whitespace'))
      })
    })

    describe('when the repo owner is not a string', () => {
      test('it throws a TypeError specifying the correct type for the repo owner', async () => {
        const configContents = await fsPromises.readFile('./tests/configWrongTypeRepoOwnerName.json')

        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "owner" was found not to be a string`))
      })
    })

    describe('when the repo name is not a string', () => {
      test('it throws a TypeError specifying the correct type for repo name', async () => {
        const configContents = await fsPromises.readFile('./tests/configWrongTypeRepoName.json')

        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "repo" was found not to be a string`))
      })
    })

    describe('the labeling rules', () => {
      let consoleLoggingFunctionSpies: {[name: string]: jest.SpiedFunction<typeof console.warn>}

      function initializeSpies () {
        consoleLoggingFunctionSpies = {
          info: jest.spyOn(console, 'info'),
          warn: jest.spyOn(console, 'warn'),
          error: jest.spyOn(console, 'error')
        }
      }

      function deactivateSpies () {
        for (const consoleLoggingFunctionName in consoleLoggingFunctionSpies) {
          consoleLoggingFunctionSpies[consoleLoggingFunctionName].mockReset()
        }
      }

      beforeEach(() => {
        initializeSpies()
      })

      afterEach(() => {
        deactivateSpies()
      })

      describe('when the column-label-config is not an array', () => {
        test('it throws a TypeError with a message describing the config key and correct type', async () => {
          const configContents = await fsPromises.readFile('./tests/configWrongTypeLabelingRules.json')
  
          expect(() => {
            validateConfig(configContents.toString())
          }).toThrow(new TypeError(`Member "column-label-config" was found not to be an array`))
        })
      })

      describe('when a column configuration is not an object', () => {
        const COLUMN_CONFIGURATION_COUNT = 3
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]

        beforeAll(async () => {
          const configContents = await fsPromises.readFile('./tests/configColumnConfigurationsInvalidType.json')

          validateConfig(configContents.toString())

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
          consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
        })

        test('it prints errors with the index of the invalid element', () => {
          for (let i = 0; i < COLUMN_CONFIGURATION_COUNT; i++) {
            expect(consoleWarnCalls[i][0]).toMatch(new RegExp(`Could not make valid column configuration from value at index: ${i}\\. Skipping column\\.`))
            expect(consoleErrorCalls[i][0]).toMatch(/Column configuration must be an object/)
          }
        })

        test('it indents the error output more than the warning output', () => {
          for (let i = 0; i < COLUMN_CONFIGURATION_COUNT; i++) {
            expect(hasGreaterIndentation(consoleWarnCalls[i][0], consoleErrorCalls[i][0])).toBe(true)
          }
        })
      })

      describe('when the column configuration is missing a required key', () => {
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]

        beforeAll(async () => {
          const configContents = await fsPromises.readFile('./tests/configColumnConfigurationMissingKeys.json')

          validateConfig(configContents.toString())

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
          consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
        })

        describe('when both required keys are missing', () => {
          test('errors are printed with the index of the invalid column configuration', () => {
            expect(consoleWarnCalls[0][0]).toMatch(/Could not make valid column configuration from value at index: 0\. Skipping column\./)
            expect(consoleErrorCalls[0][0]).toMatch(/key "[a-zA-Z]+" was not found in the object/)
          })
        })

        describe('when "labelingRules" is missing', () => {
          test('errors are printed with the index of the invalid column configuration', () => {
            expect(consoleWarnCalls[1][0]).toMatch(/Could not make valid column configuration from value at index: 1\. Skipping column\./)
            expect(consoleErrorCalls[1][0]).toMatch(/key "labelingRules" was not found in the object/)
          })
        })

        describe('when "columnName" is missing', () => {
          test('errors are printed with the index of the invalid column configuration', () => {
            expect(consoleWarnCalls[2][0]).toMatch(/Could not make valid column configuration from value at index: 2\. Skipping column\./)
            expect(consoleErrorCalls[2][0]).toMatch(/key "columnName" was not found in the object/)
          })
        })

        test('it indents the error output more than the warning output', () => {
          const COLUMN_CONFIGURATION_COUNT = 3

          for(let i = 0; i < COLUMN_CONFIGURATION_COUNT; i++) {
            expect(hasGreaterIndentation(consoleWarnCalls[i][0], consoleErrorCalls[i][0])).toBe(true)
          }
        })
      })

      describe('when a column configuration has invalid values', () => {
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]

        beforeAll(async () => {
          const configContents = await fsPromises.readFile('./tests/configColumnConfigurationInvalidValues.json')

          validateConfig(configContents.toString())

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
          consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
        })

        describe('when "columnName" is of the wrong type', () => {
          test('errors are printed with the index of the invalid column configuration', () => {
            expect(consoleWarnCalls[0][0]).toMatch(/Could not make valid column configuration from value at index: 0\. Skipping column\./)
            expect(consoleErrorCalls[0][0]).toMatch(/Member "columnName" was found not to be a string/)
          })
        })

        describe('when "labelingRules" is of the wrong type', () => {
          test('errors are printed with the index of the invalid column configuration', () => {
            expect(consoleWarnCalls[1][0]).toMatch(/Could not make valid column configuration from value at index: 1\. Skipping column\./)
            expect(consoleErrorCalls[1][0]).toMatch(/Member "labelingRules" was found not to be an array/)
          })
        })

        describe('when "columnName" contains only whitespace', () => {
          test('errors are printed with the index of the invalid column configuration', () => {
            expect(consoleWarnCalls[2][0]).toMatch(/Could not make valid column configuration from value at index: 2\. Skipping column\./)
            expect(consoleErrorCalls[2][0]).toMatch(/columnName must contain at least one non whitespace character/)
          })
        })

        describe('when "columnName" is empty string', () => {
          test('errors are printed with the index of the invalid column configuration', () => {
            expect(consoleWarnCalls[3][0]).toMatch(/Could not make valid column configuration from value at index: 3\. Skipping column\./)
            expect(consoleErrorCalls[3][0]).toMatch(/columnName must contain at least one non whitespace character/)
          })
        })

        test('it indents the error output more than the warning output', () => {
          const COLUMN_CONFIGURATION_COUNT = 4

          for(let i = 0; i < COLUMN_CONFIGURATION_COUNT; i++) {
            expect(hasGreaterIndentation(consoleWarnCalls[i][0], consoleErrorCalls[i][0])).toBe(true)
          }
        })
      })

      describe('when all of the labeling rules of a column configuration are invalid', () => {
        const LABELING_RULE_COUNT = 6
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]

        beforeAll(async () => {
          const configContents = await fsPromises.readFile('./tests/configLabelingRulesInvalidValues.json')

          validateConfig(configContents.toString())

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
          consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
        })

        test('it prints errors specifying the index of the invalid element, why that element is invalid, and what will be done with the element', () => {
          expect(consoleWarnCalls[0][0]).toMatch(/Could not make valid labeling rule from value at index: 0\. Skipping rule\./)
          expect(consoleErrorCalls[0][0]).toMatch(/key "action" was not found in the object/)
          expect(hasGreaterIndentation(consoleWarnCalls[0][0], consoleErrorCalls[0][0])).toBe(true)

          expect(consoleWarnCalls[1][0]).toMatch(/Could not make valid labeling rule from value at index: 1\. Skipping rule\./)
          expect(consoleErrorCalls[1][0]).toMatch(/key "labels" was not found in the object/)
          expect(hasGreaterIndentation(consoleWarnCalls[1][0], consoleErrorCalls[1][0])).toBe(true)
          console.log(consoleWarnCalls)
          console.log(consoleErrorCalls)
        })
      })
    })
  })
})