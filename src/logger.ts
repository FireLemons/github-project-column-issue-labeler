import commandLineColor from 'cli-color'

function indentationAmountToString (indentationAmount: number): string {
  return ' '.repeat(indentationAmount)
}

function formatSubequentLines (lines: string[], indentation: number, applyColor: (...text: any[]) => string): string {
  const formattedLines = lines.map((line) => {
    return indentationAmountToString(indentation) + applyColor(line)
  })

  if (formattedLines.length) {
    formattedLines[0] = '\n' + formattedLines[0]
  }

  return formattedLines.join('\n')
}

function makePrettyString (message: string, level: string, indentation: number, applyColor: (...text: any[]) => string): string {
  const messageLines = message.split('\n')

  const firstLineFormatted = applyColor(`${level}: ${indentationAmountToString(indentation)}${messageLines[0]}`)
  const remainingLinesFormatted = formatSubequentLines(messageLines.slice(1), indentation + level.length + 2, applyColor)

  return firstLineFormatted + remainingLinesFormatted
}

export function info (message: string, indentation: number = 0) {
  console.info(makePrettyString(message, 'INFO', indentation, commandLineColor.cyan))
}

export function error (message: string, indentation: number = 0) {
  console.error(makePrettyString(message, 'FAIL', indentation, commandLineColor.red))
}

export function warn (message: string, indentation: number = 0) {
  console.warn(makePrettyString(message, 'WARN', indentation, commandLineColor.yellow))
}