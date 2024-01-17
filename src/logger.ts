const command_line_color = require('cli-color')
const core = require('@actions/core')

export function info (message: string) {
  core.info('        ' + command_line_color.cyan(message))
}

export function error (message: string) {
  core.error('  ' + command_line_color.red(message))
}

export function warn (message: string) {
  core.warning(command_line_color.yellow(message))
}