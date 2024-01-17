const command_line_color = require('cli-color')
const typeChecker = require('./typeChecker')

class Logger {
  githubActionsCore: any
  constructor (githubActionsCore: any) {
    if (!(typeChecker.isObject(githubActionsCore))) {
      throw new TypeError('Param githubActionsCore must be an object')
    }

    this.githubActionsCore = githubActionsCore
  }

  info (message: string) {
    this.githubActionsCore.info(command_line_color.cyan(message))
  }

  error (message: string) {
    this.githubActionsCore.error(command_line_color.red(message))
  }

  warn (message: string) {
    this.githubActionsCore.warn(command_line_color.yellow(message))
  }
}

module.exports = Logger