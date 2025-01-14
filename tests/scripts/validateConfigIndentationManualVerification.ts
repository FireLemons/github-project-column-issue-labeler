import { Logger } from '../../src/logger'
import ConfigValidator from '../../src/validateConfig'

const ConfigTestData: { [key: string]: any } = require('../data/configTestData').default
const logger = new Logger()

function main() {
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

    new ConfigValidator(logger).validateConfig(configFileContents)

    console.log('') // newline
  }
}

main()
