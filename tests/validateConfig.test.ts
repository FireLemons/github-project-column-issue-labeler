import fs from 'fs'
import validateConfig from '../src/validateConfig'

const fsPromises = fs.promises

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
      test('it throws a TypeError with a message describing the config key and correct type', async () => {
        const configContents = await fsPromises.readFile('./tests/configWrongTypeGithubAccessToken.json')
  
        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "access-token" was found not to be a string`))
      })
    })

    describe('when the github access token contains only whitespace', () => {
      test('it throws a RangeError with a message warning abour the empty github token', async () => {
        const configContents = await fsPromises.readFile('./tests/configEmptyGithubAccessToken.json')
  
        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new RangeError('The github access token cannot be empty or contain only whitespace'))
      })
    })

    describe('when the repo owner is not a string', () => {
      test('it throws a TypeError with a message describing the config key and correct type', async () => {
        const configContents = await fsPromises.readFile('./tests/configWrongTypeRepoOwnerName.json')

        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "owner" was found not to be a string`))
      })
    })

    describe('when the repo name is not a string', () => {
      test('it throws a TypeError with a message describing the config key and correct type', async () => {
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

      describe('when the labeling rules are not an array', () => {
        test('it throws a TypeError with a message describing the config key and correct type', async () => {
          const configContents = await fsPromises.readFile('./tests/configWrongTypeLabelingRules.json')
  
          expect(() => {
            validateConfig(configContents.toString())
          }).toThrow(new TypeError(`Member "column-label-config" was found not to be an array`))
        })
      })

      describe('when all of the column configurations are not objects', () => {
        test('it prints errors specifying the index of the invalid element and why that element is invalid', async () => {
          const configContents = await fsPromises.readFile('./tests/configColumnConfigurationsInvalidType.json')
          const LABELING_RULE_COUNT = 3

          validateConfig(configContents.toString())

          const consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
          const consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls

          expect(consoleWarnCalls.length).toBe(LABELING_RULE_COUNT)
          expect(consoleErrorCalls.length).toBe(LABELING_RULE_COUNT)

          for (let i = 0; i < LABELING_RULE_COUNT; i++) {
            expect(consoleWarnCalls[i][0]).toMatch(new RegExp(`Could not make valid column configuration from value at index: ${i}. Skipping column.`))
            expect(consoleErrorCalls[i][0]).toMatch(/  Column configuration must be an object/)
          }
        })
      })

      describe('when all of the column configurations are missing a required key', () => {
        test('it prints errors specifying the index of the invalid element and why that element is invalid', async () => {
          const configContents = await fsPromises.readFile('./tests/configColumnConfigurationMissingKeys.json')
          const LABELING_RULE_COUNT = 3

          validateConfig(configContents.toString())

          const consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
          const consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls

          expect(consoleWarnCalls.length).toBe(LABELING_RULE_COUNT)
          expect(consoleErrorCalls.length).toBe(LABELING_RULE_COUNT)

          expect(consoleWarnCalls[0][0]).toMatch(new RegExp(`Could not make valid column configuration from value at index: ${0}. Skipping column.`))
          expect(consoleErrorCalls[0][0]).toMatch(/  key "columnName" was not found in the object/)

          expect(consoleWarnCalls[1][0]).toMatch(new RegExp(`Could not make valid column configuration from value at index: ${1}. Skipping column.`))
          expect(consoleErrorCalls[1][0]).toMatch(/  key "labelingRules" was not found in the object/)

          expect(consoleWarnCalls[2][0]).toMatch(new RegExp(`Could not make valid column configuration from value at index: ${2}. Skipping column.`))
          expect(consoleErrorCalls[2][0]).toMatch(/  key "columnName" was not found in the object/)
        })
      })

      describe('when all of the column configurations have invalid values for required values', () => {
        test('it prints errors specifying the index of the invalid element and why that element is invalid', async () => {
          const configContents = await fsPromises.readFile('./tests/configColumnConfigurationInvalidValues.json')
          const LABELING_RULE_COUNT = 4

          validateConfig(configContents.toString())

          const consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
          const consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls

          expect(consoleWarnCalls.length).toBe(LABELING_RULE_COUNT)
          expect(consoleErrorCalls.length).toBe(LABELING_RULE_COUNT)

          expect(consoleWarnCalls[0][0]).toMatch(new RegExp(`Could not make valid column configuration from value at index: ${0}. Skipping column.`))
          expect(consoleErrorCalls[0][0]).toMatch(/  Member "columnName" was found not to be a string/)

          expect(consoleWarnCalls[1][0]).toMatch(new RegExp(`Could not make valid column configuration from value at index: ${1}. Skipping column.`))
          expect(consoleErrorCalls[1][0]).toMatch(/  Member "labelingRules" was found not to be an array/)

          expect(consoleWarnCalls[2][0]).toMatch(new RegExp(`Could not make valid column configuration from value at index: ${2}. Skipping column.`))
          expect(consoleErrorCalls[2][0]).toMatch(/  columnName must contain at least one non whitespace character/)

          expect(consoleWarnCalls[2][0]).toMatch(new RegExp(`Could not make valid column configuration from value at index: ${2}. Skipping column.`))
          expect(consoleErrorCalls[2][0]).toMatch(/  columnName must contain at least one non whitespace character/)
        })
      })
    })
  })
})