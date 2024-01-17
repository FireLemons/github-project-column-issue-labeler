const command_line_color = require('cli-color')
const core = require('@actions/core')

class Logger {
  info (message: string) {
    core.info('        ' + command_line_color.cyan(message))
  }

  error (message: string) {
    core.error('  ' + command_line_color.red(message))
  }

  warn (message: string) {
    core.warning(command_line_color.yellow(message))
  }
}

module.exports = Logger