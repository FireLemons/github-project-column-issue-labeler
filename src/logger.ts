const command_line_color = require('cli-color')

class Logger {
  info (message: string) {
    console.log(command_line_color.cyan(message))
  }

  error (message: string) {
    console.error(command_line_color.red(message))
  }

  warn (message: string) {
    console.warn(command_line_color.yellow(message))
  }
}

module.exports = Logger