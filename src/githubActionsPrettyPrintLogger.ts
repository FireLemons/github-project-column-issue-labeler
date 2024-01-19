import commandLineColor from 'cli-color'
import * as core from '@actions/core'

function makePrettyString (message: string, indentation: string, applyColor: (...text: any[]) => string): string {
  const messageLines = message.split('\n')

  return messageLines.map((line) => {
    return indentation + applyColor(line)
  }).join('\n')
}

export function info (message: string, indentation: string = '') {
  const adjustedIndentation: string = indentation + '         '; // Used to line up with warning messages prefixed with "Warning: "

  core.info(makePrettyString(message, adjustedIndentation, commandLineColor.cyan))
}

export function error (message: string, indentation: string = '') {
  const adjustedIndentation = indentation + '  '
  core.error(makePrettyString(message, adjustedIndentation, commandLineColor.red))
}

export function warn (message: string, indentation: string = '') {
  core.warning(makePrettyString(message, indentation, commandLineColor.yellow))
}