import commandLineColor from 'cli-color'

function indentationAmountToString (indentationAmount: number): string {
  return ' '.repeat(indentationAmount)
}

function formatSubequentLines (lines: string[], spaceIndentationCount: number, applyColor: (...text: any[]) => string): string {
  const formattedLines = lines.map((line) => {
    return indentationAmountToString(spaceIndentationCount) + applyColor(line)
  })

  if (formattedLines.length) {
    formattedLines[0] = '\n' + formattedLines[0]
  }

  return formattedLines.join('\n')
}

function makePrettyString (message: string, level: string, spaceIndentationCount: number, applyColor: (...text: any[]) => string): string {
  const messageLines = message.split('\n')

  const firstLineFormatted = applyColor(`${level}: ${indentationAmountToString(spaceIndentationCount)}${messageLines[0]}`)
  const remainingLinesFormatted = formatSubequentLines(messageLines.slice(1), spaceIndentationCount + level.length + 2, applyColor)

  return firstLineFormatted + remainingLinesFormatted
}

export function info (message: string, spaceIndentationCount: number = 0) {
  console.info(makePrettyString(message, 'INFO', spaceIndentationCount, commandLineColor.cyan))
}

export function error (message: string, spaceIndentationCount: number = 0) {
  console.error(makePrettyString(message, 'FAIL', spaceIndentationCount, commandLineColor.red))
}

export function warn (message: string, spaceIndentationCount: number = 0) {
  console.warn(makePrettyString(message, 'WARN', spaceIndentationCount, commandLineColor.yellow))
}