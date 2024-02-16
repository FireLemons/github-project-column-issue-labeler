import commandLineColor from 'cli-color'

function makePrettyString (message: string, level: string, indentation: string, applyColor: (...text: any[]) => string): string {
  const messageLines = message.split('\n')

  const firstLine = applyColor(`${level}: ${indentation}${messageLines[0]}`)
  const remainingLines = messageLines.slice(1)

  const adjustedIndentation = indentation + ' '.repeat(level.length + 2)

  return [firstLine, ...remainingLines.map((line) => {
    return adjustedIndentation + applyColor(line)
  })].join('\n')
}

export function info (message: string, indentation: string = '') {
  console.info(makePrettyString(message, 'INFO', indentation, commandLineColor.cyan))
}

export function error (message: string, indentation: string = '') {
  console.error(makePrettyString(message, 'FAIL', indentation, commandLineColor.red))
}

export function warn (message: string, indentation: string = '') {
  console.warn(makePrettyString(message, 'WARN', indentation, commandLineColor.yellow))
}