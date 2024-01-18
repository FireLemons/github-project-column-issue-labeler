import * as command_line_color from 'cli-color'
import * as core from '@actions/core'

export function info (message: string) {
  core.info('        ' + command_line_color.cyan(message))
}

export function error (message: string) {
  core.error('  ' + command_line_color.red(message))
}

export function warn (message: string) {
  core.warning(command_line_color.yellow(message))
}