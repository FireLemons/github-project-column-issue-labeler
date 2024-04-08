import fs from 'fs'
import validateConfig from '../src/validateConfig'
import { Config, LabelingAction, LabelingRule, isShallowColumn } from '../src/LabelerConfig'
import exp from 'constants'

const fsPromises = fs.promises

function countSpaceIndentationOfLoggerMessage (text: string): number {
  return text.slice(11).search(/\S/)
}

function hasGreaterIndentation (expectedLesserIndentationMessage: string, expectedGreaterIndentationMessage: string): boolean {
  return countSpaceIndentationOfLoggerMessage(expectedGreaterIndentationMessage) - countSpaceIndentationOfLoggerMessage(expectedLesserIndentationMessage) === 2
}

describe('validateConfig()', () => {
  describe('when config contains invalid json', () => {
    it('throws an error with a message describing that the file did not contain parsable JSON', async () => {
      const configContents = await fsPromises.readFile('./tests/configInvalidJSON.json') // These are in separate files so the json can be syntax highlighted

      expect(() => {
        validateConfig(configContents.toString())
      }).toThrow(new SyntaxError('Could not parse config as JSON'))
    })
  })

  describe('when config is missing a required key', () => {
    it('throws an error with a message describing that the file is missing a required key', async () => {
      const configContents = await fsPromises.readFile('./tests/configMissingKey.json')

      expect(() => {
        validateConfig(configContents.toString())
      }).toThrow(new ReferenceError(`key "accessToken" was not found in the object`))
    })
  })

  describe('when the config contains all required keys', () => {
    describe('when the github access token is not a string', () => {
      it('throws a TypeError specifying the correct type for the github access token', async () => {
        const configContents = await fsPromises.readFile('./tests/configWrongTypeGithubAccessToken.json')
  
        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "accessToken" was found not to be a string`))
      })
    })

    describe('when the github access token contains only whitespace', () => {
      it('throws a RangeError', async () => {
        const configContents = await fsPromises.readFile('./tests/configEmptyGithubAccessToken.json')
  
        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new RangeError('The github access token cannot be empty or contain only whitespace'))
      })
    })

    describe('when the repo owner is not a string', () => {
      it('throws a TypeError specifying the correct type for the repo owner', async () => {
        const configContents = await fsPromises.readFile('./tests/configWrongTypeRepoOwnerName.json')

        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "owner" was found not to be a string`))
      })
    })

    describe('when the repo name is not a string', () => {
      it('throws a TypeError specifying the correct type for repo name', async () => {
        const configContents = await fsPromises.readFile('./tests/configWrongTypeRepoName.json')

        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "repo" was found not to be a string`))
      })
    })

    describe('columns', () => {
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

      describe('when the columns is not an array', () => {
        test('it throws a TypeError with a message describing the config key and correct type', async () => {
          const configContents = await fsPromises.readFile('./tests/configWrongTypeLabelingRules.json')
  
          expect(() => {
            validateConfig(configContents.toString())
          }).toThrow(new TypeError(`Member "columns" was found not to be an array`))
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

        describe('when "name" is missing', () => {
          test('errors are printed with the index of the invalid column configuration', () => {
            expect(consoleWarnCalls[2][0]).toMatch(/Could not make valid column configuration from value at index: 2\. Skipping column\./)
            expect(consoleErrorCalls[2][0]).toMatch(/key "name" was not found in the object/)
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

        describe('when "name" is of the wrong type', () => {
          test('errors are printed with the index of the invalid column configuration', () => {
            expect(consoleWarnCalls[0][0]).toMatch(/Could not make valid column configuration from value at index: 0\. Skipping column\./)
            expect(consoleErrorCalls[0][0]).toMatch(/Member "name" was found not to be a string/)
          })
        })

        describe('when "labelingRules" is of the wrong type', () => {
          test('errors are printed with the index of the invalid column configuration', () => {
            expect(consoleWarnCalls[1][0]).toMatch(/Could not make valid column configuration from value at index: 1\. Skipping column\./)
            expect(consoleErrorCalls[1][0]).toMatch(/Member "labelingRules" was found not to be an array/)
          })
        })

        describe('when "name" contains only whitespace', () => {
          test('errors are printed with the index of the invalid column configuration', () => {
            expect(consoleWarnCalls[2][0]).toMatch(/Could not make valid column configuration from value at index: 2\. Skipping column\./)
            expect(consoleErrorCalls[2][0]).toMatch(/name must contain at least one non whitespace character/)
          })
        })

        describe('when "name" is empty string', () => {
          test('errors are printed with the index of the invalid column configuration', () => {
            expect(consoleWarnCalls[3][0]).toMatch(/Could not make valid column configuration from value at index: 3\. Skipping column\./)
            expect(consoleErrorCalls[3][0]).toMatch(/name must contain at least one non whitespace character/)
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
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config

        beforeAll(async () => {
          const configContents = await fsPromises.readFile('./tests/configLabelingRulesInvalidValues.json')

          validatedConfig = validateConfig(configContents.toString())

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
          consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
        })

        describe('when the rule is missing both required keys', () => {
          test('errors are printed with the index of the invalid labeling rule', () => {
            expect(consoleWarnCalls[0][0]).toMatch(/Could not make valid labeling rule from value at index: 0\. Skipping rule\./)
            expect(consoleErrorCalls[0][0]).toMatch(/key "[a-zA-Z]+" was not found in the object/)
          })
        })

        describe('when the rule is missing the "labels" key', () => {
          test('errors are printed with the index of the invalid labeling rule', () => {
            expect(consoleWarnCalls[1][0]).toMatch(/Could not make valid labeling rule from value at index: 1\. Skipping rule\./)
            expect(consoleErrorCalls[1][0]).toMatch(/key "labels" was not found in the object/)
          })
        })

        describe('when the rule is missing the "action" key', () => {
          test('errors are printed with the index of the invalid labeling rule', () => {
            expect(consoleWarnCalls[2][0]).toMatch(/Could not make valid labeling rule from value at index: 2\. Skipping rule\./)
            expect(consoleErrorCalls[2][0]).toMatch(/key "action" was not found in the object/)
          })
        })

        describe('when the value of "action" is not a string', () => {
          test('errors are printed with the index of the invalid labeling rule', () => {
            expect(consoleWarnCalls[3][0]).toMatch(/Could not make valid labeling rule from value at index: 3\. Skipping rule\./)
            expect(consoleErrorCalls[3][0]).toMatch(/Member "action" was found not to be a string/)
          })
        })

        describe('when the value of "labels" is not an array', () => {
          test('errors are printed with the index of the invalid labeling rule', () => {
            expect(consoleWarnCalls[4][0]).toMatch(/Could not make valid labeling rule from value at index: 4\. Skipping rule\./)
            expect(consoleErrorCalls[4][0]).toMatch(/Member "labels" was found not to be an array/)
          })
        })

        describe('when the value of "action" is not supported', () => {
          test('errors are printed with the index of the invalid labeling rule', () => {
            expect(consoleWarnCalls[5][0]).toMatch(/Could not make valid labeling rule from value at index: 5\. Skipping rule\./)
            expect(consoleErrorCalls[5][0]).toMatch(/Labeling action ".+" is not supported. Supported actions are: \["ADD","REMOVE","SET"\]/)
          })
        })

        it('indents the error output more than the warning output', () => {
          const LABELING_RULE_COUNT = 6

          for(let i = 0; i < LABELING_RULE_COUNT; i++) {
            expect(hasGreaterIndentation(consoleWarnCalls[i][0], consoleErrorCalls[i][0])).toBe(true)
          }
        })

        it('prints a warning that the column configuration will not be used', () => {
          expect(consoleWarnCalls[6][0]).toMatch(/Column configuration at index: 0 did not contain any valid labeling rules. Skipping column./)
        })

        test('the validated config will not include the column configuration', () => {
          expect(validatedConfig.columns.find((columnConfig) => {
            return columnConfig.name === 'Name'
          })).toBe(undefined)
        })
      })

      describe('when there are multiple labeling rules with a "SET" action', () => {
        let consoleInfoCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config

        beforeAll(async () => {
          const configContents = await fsPromises.readFile('./tests/configLabelingRulePrecedenceSetOrder.json')

          validatedConfig = validateConfig(configContents.toString())

          consoleInfoCalls = consoleLoggingFunctionSpies.info.mock.calls
        })

        test('only the last labeling rule with a "SET" action appears in the validated config', () => {
          expect(validatedConfig.columns.length).toBe(1)
          expect(validatedConfig.columns[0].labelingRules.length).toBe(1)
          expect(validatedConfig.columns[0].labelingRules[0].action).toBe(LabelingAction.SET)
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

        beforeAll(async () => {
          const configContents = await fsPromises.readFile('./tests/configLabelingActionPrecedence.json')

          validatedConfig = validateConfig(configContents.toString())

          consoleInfoCalls = consoleLoggingFunctionSpies.info.mock.calls
        })

        test('only the labeling rule with a "SET" action appears in the validated config', () => {
          expect(validatedConfig.columns.length).toBe(1)
          expect(validatedConfig.columns[0].labelingRules.length).toBe(1)
          expect(validatedConfig.columns[0].labelingRules[0].action).toBe(LabelingAction.SET)
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

        beforeAll(async () => {
          const configContents = await fsPromises.readFile('./tests/configLabelsInvalid.json')

          validatedConfig = validateConfig(configContents.toString())

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
          const { labelingRules } =  validatedConfig.columns[0]

          expect(labelingRules.findIndex((rule) => {
            return rule.action === LabelingAction.ADD
          })).toBe(-1)
        })

        test('a warning is printed stating that the labeling rule will not be used', () => {
          expect(consoleWarnCalls[3][0]).toMatch(/Labeling rule at index: 0 did not contain any valid labels\. Skipping rule\./)
        })
      })

      describe('when a column configuration does not contain SET labeling rules', () => {
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config

        beforeAll(async () => {
          const configContents = await fsPromises.readFile('./tests/configLabelDuplicationAndUnsorted.json')

          validatedConfig = validateConfig(configContents.toString())

          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        describe('when there are multiple ADD labeling rules', () => {
          let addRule: LabelingRule | undefined

          beforeAll(() => {
            addRule = validatedConfig.columns[0].labelingRules.find((labelingRule) => {
              return labelingRule.action === LabelingAction.ADD
            })
          })

          test('all of the unique labels between all of the ADD rules are combined under a single rule', () => {
            expect(addRule).not.toBe(undefined)
            expect(addRule?.labels.length).toBe(3)
          })

          test('the lables of the ADD rule are sorted alphabetically', () => {
            const addRuleLabels = addRule?.labels

            expect(addRuleLabels?.findIndex((label) => {
              return label.localeCompare('Duplicate Label', undefined, {sensitivity: 'base'}) === 0
            })).toBe(0)

            expect(addRuleLabels?.findIndex((label) => {
              return label.localeCompare('Help Wanted', undefined, {sensitivity: 'base'}) === 0
            })).toBe(1)

            expect(addRuleLabels?.findIndex((label) => {
              return label.localeCompare('New', undefined, {sensitivity: 'base'}) === 0
            })).toBe(2)
          })
        })

        describe('when there are multiple REMOVE labeling rules', () => {
          let removeRule: LabelingRule | undefined

          beforeAll(() => {
            removeRule = validatedConfig.columns[0].labelingRules.find((labelingRule) => {
              return labelingRule.action === LabelingAction.REMOVE
            })
          })

          test('all of the unique labels between all of the REMOVE rules are combined under a single rule', () => {
            expect(removeRule).not.toBe(undefined)
            expect(removeRule?.labels.length).toBe(3)
          })

          test('the lables of the REMOVE rule are sorted alphabetically', () => {
            const removeRuleLabels = removeRule?.labels

            expect(removeRuleLabels?.findIndex((label) => {
              return label.localeCompare('Completed', undefined, {sensitivity: 'base'}) === 0
            })).toBe(0)

            expect(removeRuleLabels?.findIndex((label) => {
              return label.localeCompare('Completed 1', undefined, {sensitivity: 'base'}) === 0
            })).toBe(1)

            expect(removeRuleLabels?.findIndex((label) => {
              return label.localeCompare('Duplicate emoji 🐌', undefined, {sensitivity: 'base'}) === 0
            })).toBe(2)
          })
        })

        describe('when an ADD and REMOVE rule contain the same label', () => {
          beforeAll(async () => {
            const configContents = await fsPromises.readFile('./tests/configLabelingRulesLabelConflict.json')
  
            validatedConfig = validateConfig(configContents.toString())

            consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
          })

          test('the label does not appear in the validated config', () => {
            const columnConfiguration = validatedConfig.columns[0]
            const addRule = columnConfiguration.labelingRules.find((labelingRule) => { return labelingRule.action === LabelingAction.ADD })
            const removeRule = columnConfiguration.labelingRules.find((labelingRule) => { return labelingRule.action === LabelingAction.REMOVE })

            expect(addRule?.labels.length).toBe(1)
            expect(removeRule?.labels.length).toBe(1)

            if (addRule && removeRule) {
              for(let label of addRule.labels) {
                expect(removeRule.labels.find((removeLabel) => { return label.localeCompare(removeLabel, undefined, {sensitivity: 'base'}) === 0 })).toBe(undefined)
              }
            }
          })

          test('a warning is printed stating that the label will be removed from both rules', () => {
            expect(consoleWarnCalls[0][0]).toMatch(/Found same label: "ambiguous label conflict" in both ADD and REMOVE labeling rules\. Removing label\./)
          })
        })
      })

      describe('when there are invalid parts of the config that are not required', () => {
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]
        let validatedConfig: Config

        beforeAll(async () => {
          const configContents = await fsPromises.readFile('./tests/configPartialValid.json')

          validatedConfig = validateConfig(configContents.toString())

          consoleErrorCalls = consoleLoggingFunctionSpies.error.mock.calls
          consoleWarnCalls = consoleLoggingFunctionSpies.warn.mock.calls
        })

        it('will not contain the invalid column', () => {
          expect(validatedConfig.columns.find((column) => {
            return column.name === 'invalid column'
          })).toBe(undefined)
        })

        it('will contain the valid column', () => {
          expect(validatedConfig.columns.find((column) => {
            return column.name === 'valid column' && isShallowColumn(column)
          })).not.toBe(undefined)
        })

        it('will not contain the invalid labeling rule', () => {})
        it('will contain the valid labeling rule', () => {})
        it('will not contain the invalid labels', () => {})
        it('will contain the valid labels', () => {})
      })
    })
  })
})