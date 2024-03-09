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
        const configContents = await fsPromises.readFile('./tests/configGithubAccessTokenWrongType.json')
  
        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "access-token" was found not to be a string`))
      })
    })

    describe('when the repo owner is not a string', () => {
      test('it throws a TypeError with a message describing the config key and correct type', async () => {
        const configContents = await fsPromises.readFile('./tests/configRepoOwnerNameWrongType.json')

        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "owner" was found not to be a string`))
      })
    })

    describe('when the repo name is not a string', () => {
      test('it throws a TypeError with a message describing the config key and correct type', async () => {
        const configContents = await fsPromises.readFile('./tests/configRepoNameWrongType.json')

        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "repo" was found not to be a string`))
      })
    })

    describe('when the labeling rules are not an array', () => {
      test('it throws a TypeError with a message describing the config key and correct type', async () => {
        const configContents = await fsPromises.readFile('./tests/configLabelingRulesWrongType.json')

        expect(() => {
          validateConfig(configContents.toString())
        }).toThrow(new TypeError(`Member "column-label-config" was found not to be an array`))
      })
    })
  })
})