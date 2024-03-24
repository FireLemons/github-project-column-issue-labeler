import fs from 'fs'
import { Logger } from '../src/logger'
import validateConfig from '../src/validateConfig'

const fsPromises = fs.promises
const logger = new Logger()
const TEST_FOLDER_PATH = './tests/'

async function loadConfig(path: string): Promise<string> {
  const configContents = await fsPromises.readFile(path)

  return "" + configContents
}

async function main() {
  const testFiles = fsPromises.readdir(TEST_FOLDER_PATH)
  const configs = (await testFiles).filter(
    (fileName) => {
      return fileName.endsWith('.json')
    }
  )

  let configFileContents

  for (const configFileName of configs) {
    logger.info(`Config: ${configFileName}`)

    try {
      logger.info('Loading Config')
      configFileContents = await loadConfig(TEST_FOLDER_PATH + configFileName)
    } catch (error) {
      logger.error('Failed to load config', 2)
      if (error instanceof Error) {
        logger.error(error.message, 4)
      }

      return
    }

    let config

    try {
      logger.info('Validating Config')
      config = validateConfig(configFileContents)

      if (!(config['column-label-config'].length)) {
        logger.error('Could not find any valid actions to perform from the configuration')
      }

      logger.info('Validated Config:')
      logger.info(JSON.stringify(config, null, 2))
    } catch (error) {
      if (error instanceof Error && error.message) {
        logger.error('Failed to validate config')
        logger.error(error.message, 2)
      }
    }

    console.log('')
  }
}

main()