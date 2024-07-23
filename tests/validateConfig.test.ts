import fs from 'fs'
import ConfigTestData from './configTestData'
import { validateConfig } from '../src/validateConfig'
import { ColumnConfiguration, Config, LabelingAction, LabelingRule, isShallowColumn, isShallowLabelingRule } from '../src/labelerConfig'
import { caseInsensitiveCompare, hasTrailingWhitespace, isCaseInsensitiveEqual } from '../src/util'

const fsPromises = fs.promises

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
    it('throws an error with a message describing that the file did not contain parsable JSON', () => {
      const configContents = ConfigTestData.invalidJSON

      expect(() => {
        validateConfig(configContents.toString())
      }).toThrow(new SyntaxError('Could not parse config as JSON'))
    })
  })

  describe('when config is missing a required key', () => {
    it('throws an error with a message describing that the file is missing a required key', () => {
      const configContents = ConfigTestData.configMissingKey

      expect(() => {
        validateConfig(configContents.toString())
      }).toThrow(new ReferenceError(`key "accessToken" was not found in the object`))
    })
  })

  describe('when the config contains all required keys', () => {
    describe('when the github access token is not a string', () => {
      it('throws a TypeError specifying the correct type for the github access token', () => {
        const configContents = ConfigTestData.configWrongTypeAccessToken
  
        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "accessToken" was found not to be a string`))
      })
    })

    describe('when the github access token contains only whitespace', () => {
      it('throws a RangeError', () => {
        const configContents = ConfigTestData.configWhiteSpaceOnlyAccessToken
  
        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new RangeError('The github access token cannot be empty or contain only whitespace'))
      })
    })

    describe('when the repo owner is not a string', () => {
      it('throws a TypeError specifying the correct type for the repo owner', () => {
        const configContents = ConfigTestData.repoWrongTypeOwnerName

        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "ownerName" was found not to be a string`))
      })
    })

    describe('when the repo name is not a string', () => {
      it('throws a TypeError specifying the correct type for repo name', () => {
        const configContents = ConfigTestData.repoWrongTypeName

        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "name" was found not to be a string`))
      })
    })

    describe('columns', () => {
      describe('when columns is not an array', () => {
        test('it throws a TypeError with a message describing the config key and correct type', () => {
          const configContents = ConfigTestData.configWrongTypeColumns
  
          expect(() => {
            validateConfig(configContents.toString())
          }).toThrow(new TypeError(`Member "columns" was found not to be an array`))
        })
      })

      describe('when a column configuration is not an object', () => {
        const COLUMN_CONFIGURATION_COUNT = 3
        let consoleErrorCalls: [message?: any, ...optionalParams: any[]][]
        let consoleWarnCalls: [message?: any, ...optionalParams: any[]][]

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.columnArrayValuesWrongType

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

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.columnMissingRequiredKey

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

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.columnInvalidValues

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

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.columnAllInvalidLabelingRules

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

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.labelingRulesActionOrderPrecedence

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

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.lableingRulesActionTypePrecedence

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

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.labelingRulesInvalidLabels

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

        beforeAll(() => {
          resetSpies()
          const configContents = ConfigTestData.columnLabelDuplicationAndUnsortedAddRemoveActions

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
          let removeRule: LabelingRule | undefined

          beforeAll(() => {
            removeRule = validatedConfig.columns[0].labelingRules.find((labelingRule) => {
              return labelingRule.action === LabelingAction.REMOVE
            })
          })

          afterAll(() => {
            resetSpies()
          })

          test('all of the unique labels between all of the REMOVE rules are combined under a single rule', () => {
            expect(removeRule).not.toBe(undefined)
            expect(removeRule?.labels.length).toBe(3)
          })

          test('the lables of the REMOVE rule are sorted alphabetically', () => {
            const removeRuleLabels = removeRule?.labels

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
                expect(removeRule.labels.find((removeLabel) => { return isCaseInsensitiveEqual(label, removeLabel) })).toBe(undefined)
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

          validatedConfig = validateConfig(configContents.toString())
        })

        it('will not contain the invalid column', () => {
          expect(validatedConfig.columns.find((column) => {
            return column.name === 'invalid column'
          })).toBe(undefined)
        })

        it('will contain the valid column', () => {
          expect(validatedConfig.columns.find((column) => {
            return isShallowColumn(column) && column.name === 'valid column'
          })).not.toBe(undefined)
        })

        it('will not contain the invalid labeling rule', () => {
          const parentColumn = validatedConfig.columns[0]

          expect(parentColumn).toBeTruthy()

          expect(parentColumn.labelingRules.find((rule) => {
            return isShallowLabelingRule(rule) && rule.labels.find((label) => {
              return isCaseInsensitiveEqual(label, 'invalid label 1') || isCaseInsensitiveEqual(label, 'invalid label 2')
            })
          })).toBe(undefined)
        })

        it('will contain the valid labeling rules', () => {
          const parentColumn = validatedConfig.columns[0]

          expect(parentColumn).toBeTruthy()

          expect(parentColumn.labelingRules.find((rule) => {
            return isShallowLabelingRule(rule) && rule.action === LabelingAction.ADD
          })).not.toBe(undefined)

          expect(parentColumn.labelingRules.find((rule) => {
            return isShallowLabelingRule(rule) && rule.action === LabelingAction.REMOVE
          })).not.toBe(undefined)
        })

        it('will not contain the invalid labels', () => {
          const parentColumn = validatedConfig.columns[0]

          expect(parentColumn).toBeTruthy()
          expect(parentColumn.labelingRules.length).toBeGreaterThan(0)

          const allLabels = parentColumn.labelingRules.reduce<string[]>((accumulator, currentVal) => {
            accumulator.push(...currentVal.labels)

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

        it('will contain the valid labels', () => {
          const parentColumn = validatedConfig.columns[0]

          expect(parentColumn).toBeTruthy()
          expect(parentColumn.labelingRules.length).toBeGreaterThan(0)

          const allLabels = parentColumn.labelingRules.reduce<string[]>((accumulator, currentVal) => {
            accumulator.push(...currentVal.labels)

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

            validatedConfig = validateConfig(configContents.toString())
          })

          it('removes the duplicates', () => {
            const parentColumn = validatedConfig.columns[0]
            const labels = parentColumn.labelingRules[0].labels.concat(parentColumn.labelingRules[1].labels)

            expect(labels).not.toBeFalsy()

            expect(labels.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'Completed')
            }).length).toBe(1)

            expect(labels.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'Completed 1')
            }).length).toBe(1)

            expect(labels.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'Duplicate Label')
            }).length).toBe(1)

            expect(labels.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'Duplicate emoji 🐌')
            }).length).toBe(1)

            expect(labels.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'Help Wanted')
            }).length).toBe(1)

            expect(labels.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'New')
            }).length).toBe(1)
          })

          it('sorts the labels alphabetically', () => {
            const parentColumn = validatedConfig.columns[0]

            expect(parentColumn.labelingRules.find((labelingRule) => {
              return labelingRule.labels.length > 1
            })).not.toBeFalsy()

            for (let labelingRule of parentColumn.labelingRules) {
              const { labels } = labelingRule

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

            validatedConfig = validateConfig(configContents.toString())
          })

          it('removes the duplicates', () => {
            const parentColumn = validatedConfig.columns[0]
            const labels = parentColumn.labelingRules[0].labels

            expect(labels).not.toBeFalsy()

            expect(labels.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'Duplicate Label')
            }).length).toBe(1)

            expect(labels.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'Help Wanted')
            }).length).toBe(1)

            expect(labels.filter((label) => {
              return isCaseInsensitiveEqual(label.trim(), 'New')
            }).length).toBe(1)
          })

          it('sorts the labels alphabetically', () => {
            const parentColumn = validatedConfig.columns[0]
            const { labels } = parentColumn.labelingRules[0]

            expect(labels.length).toBeGreaterThan(1)

            for (let i = 0; i < labels.length - 1; i++) {
              expect(caseInsensitiveCompare(labels[i], labels[i + 1])).toBe(-1)
            }
          })
        })
      })
    })

    describe('trailing whitespace values', () => {
      let validatedConfig: Config

      beforeAll(() => {
        const configContents = ConfigTestData.configTrailingWhitespaceValues

        validatedConfig = validateConfig(configContents.toString())
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

      describe('columns', () => {
        describe('the column name', () => {
          it('does not contain trailing whitespace', () => {
            const { columns } = validatedConfig

            expect(columns.length).toBeGreaterThan(0)

            for(let column of columns) {
              expect(hasTrailingWhitespace(column.name)).toBe(false)
            }
          })
        })

        describe('the labeling rules of a column', () => {
          describe('the action of the labeling rule', () => {
            it('does not contain trailing whitespace', () => {
              const { columns } = validatedConfig

              expect(columns.length).toBeGreaterThan(0)

              for(let column of columns) {
                const { labelingRules } = column

                expect(labelingRules.length).toBeGreaterThan(0)

                for(let labelingRule of labelingRules) {
                  expect(hasTrailingWhitespace(labelingRule.action)).toBe(false)
                }
              }
            })
          })

          describe('the labels of a labeling rule', () => {
            test('the whitespace for each label is trimmed', () => {
              const { columns } = validatedConfig

              expect(columns.length).toBeGreaterThan(0)

              for(let column of columns) {
                const { labelingRules } = column
                expect(labelingRules.length).toBeGreaterThan(0)

                for(let labelingRule of labelingRules) {
                  const { labels } = labelingRule

                  expect(labels.length).toBeGreaterThan(0)

                  for(let label of labels) {
                    expect(hasTrailingWhitespace(label)).toBe(false)
                  }
                }
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

        validatedConfig = validateConfig(configContents.toString())

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

        describe('columns', () => {
          let columns: ColumnConfiguration[]
          let toDoColumn: ColumnConfiguration | undefined
          let completedColumn: ColumnConfiguration | undefined

          beforeAll(() => {
            columns = validatedConfig.columns
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
            let toDoAddLabelingRule: LabelingRule | undefined
            let toDoRemoveLabelingRule: LabelingRule | undefined
            let completedRemoveLabelingRule: LabelingRule | undefined

            it('includes the correct labeling rule(s) for each column', () => {
              if (toDoColumn) {
                toDoAddLabelingRule = toDoColumn.labelingRules.find((labelingRule) => {
                  return labelingRule.action === LabelingAction.ADD
                })

                toDoRemoveLabelingRule = toDoColumn.labelingRules.find((labelingRule) => {
                  return labelingRule.action === LabelingAction.REMOVE
                })

                expect(toDoAddLabelingRule).not.toBe(undefined)
                expect(toDoRemoveLabelingRule).not.toBe(undefined)
              }

              if (completedColumn) {
                completedRemoveLabelingRule = completedColumn.labelingRules.find((labelingRule) => {
                  return labelingRule.action === LabelingAction.REMOVE
                })

                expect(completedRemoveLabelingRule).not.toBe(undefined)
              }
            })

            it('includes the correct labels for each labeling rule', () => {
              if (toDoAddLabelingRule) {
                expect(toDoAddLabelingRule.labels.includes('hacktoberfest')).toBe(true)
                expect(toDoAddLabelingRule.labels.includes('todo')).toBe(true)
                expect(toDoAddLabelingRule.labels.includes('help wanted')).toBe(true)
              }

              if (toDoRemoveLabelingRule) {
                expect(toDoRemoveLabelingRule.labels.includes('Completed')).toBe(true)
                expect(toDoRemoveLabelingRule.labels.includes('🐌')).toBe(true)
              }

              if (completedRemoveLabelingRule) {
                expect(completedRemoveLabelingRule.labels.includes('hacktoberfest')).toBe(true)
                expect(completedRemoveLabelingRule.labels.includes('todo')).toBe(true)
                expect(completedRemoveLabelingRule.labels.includes('help wanted')).toBe(true)
              }
            }) 
          })
        })
      })
    })
  })
})
