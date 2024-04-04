import fs from 'fs'
import { Config } from '../src/LabelerConfig'
import { Logger } from '../src/logger'
import validateConfig from '../src/validateConfig'

const fsPromises = fs.promises
const logger = new Logger()
const TEST_FOLDER_PATH = './tests/'

async function listJSONFiles(directoryPath: string) {
  const fileNames = await fsPromises.readdir(directoryPath)

  return fileNames.filter((fileName) => {
      return fileName.endsWith('.json')
  })
}

async function loadConfig(path: string): Promise<string> {
  const configContents = await fsPromises.readFile(path)

  return "" + configContents
}

function randomizeOrder(arr: any[]) {
  arr.sort(() => {
    return Math.random() < 0.5 ? -1 : 1
  })
}

async function main() {
  const configs = await listJSONFiles(TEST_FOLDER_PATH)

  randomizeOrder(configs)

  let configFileContents: string

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

    let config: Config

    try {
      logger.info('Validating Config')
      config = validateConfig(configFileContents)

      if (!(config.columnLabelConfig.length)) {
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