import { Logger } from '../../src/logger'
import { Config } from '../../src/config'

const ConfigTestData: { [key: string]: any } = require('../data/configTestData').default
const logger = new Logger()

function main () {
  let configFileContents: string

  for (const configDataDescription in ConfigTestData) {
    logger.info(`Config: ${configDataDescription}`)

    try {
      logger.info('Loading Config')
      configFileContents = ConfigTestData[configDataDescription]
    } catch (error) {
      logger.error('Failed to load config', 2)
      logger.tryErrorLogErrorObject(error, 4)

      return
    }

    try {
      const config = new Config(configFileContents, logger)

      logger.info('Validated Config:')
      logger.info(config.toString(true))
    } catch (error) {
      logger.addBaseIndentation(-4)

      logger.error('Failed to validate config')
      logger.tryErrorLogErrorObject(error, 2)
    }

    console.log('') // newline
  }
}

main()
