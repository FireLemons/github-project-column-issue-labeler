import fs from 'fs'
import validateConfig from '../src/validateConfig'

const fsPromises = fs.promises

describe('validateConfig()', () => {
  describe('when config contains invalid json', () => {
    test('it should throw an error with a message describing that the file did not contain parsable JSON', async () => {
      const configContents = await fsPromises.readFile('./tests/configInvalidJSON.json')

      expect(() => {
        validateConfig(configContents.toString())
      }).toThrow(new SyntaxError('Could not parse config as JSON'))
    })
  })

  describe('when config is missing a required key', () => {
    test('it should throw an error with a message describing that the file is missing a required key', async () => {
      const configContents = await fsPromises.readFile('./tests/configMissingKey.json')

      expect(() => {
        validateConfig(configContents.toString())
      }).toThrow(new ReferenceError(`key "access-token" was not found in the object`))
    })
  })
})