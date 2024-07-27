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

    let config: Config

    try {
      logger.info('Validating Config')
      config = validateConfig(configFileContents)

      if ('projects' in config) {
        if (!(config.projects!.length)) {
          logger.error('Config does not contain any valid projects')
        }
      } else {
        if (!(config.columns!.length)) {
          logger.error('Config does not contain any valid columns')
        }
      }

      logger.info('Validated Config:')
      logger.info(JSON.stringify(config, null, 2))
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to validate config')
        logger.error(error.stack ?? error.message, 2)
      }
    }

    console.log('') // newline
  }
}

main()
