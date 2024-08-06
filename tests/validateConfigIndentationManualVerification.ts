import { Config } from '../src/configObjects'
import { Logger } from '../src/logger'
import { validateConfig } from '../src/validateConfig'

const ConfigTestData: { [key: string]: any } = require('./configTestData').default
const logger = new Logger()
const TEST_FOLDER_PATH = './tests/'

function main() {
  let configFileContents: string

  for (const configDataDescription in ConfigTestData) {
    logger.info(`Config: ${configDataDescription}`)

    try {
      logger.info('Loading Config')
      configFileContents = ConfigTestData[configDataDescription]
    } catch (error) {
      logger.error('Failed to load config', 2)
      if (error instanceof Error) {
        logger.error(error.stack ?? error.message, 4)
      }

      return
    }
 
    validateConfig(configFileContents)

    console.log('') // newline
  }
}

main()
