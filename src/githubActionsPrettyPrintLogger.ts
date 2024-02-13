import commandLineColor from 'cli-color'

function makePrettyString (message: string, indentation: string, applyColor: (...text: any[]) => string): string {
  const messageLines = message.split('\n')

  return messageLines.map((line) => {
    return indentation + applyColor(line)
  }).join('\n')
}

export function info (message: string, indentation: string = '') {
  console.info(makePrettyString('INFO:' + message, indentation, commandLineColor.cyan))
}

export function error (message: string, indentation: string = '') {
  console.error(makePrettyString('FAIL' + message, indentation, commandLineColor.red))
}

export function warn (message: string, indentation: string = '') {
  console.warn(makePrettyString('WARN' + message, indentation, commandLineColor.yellow))
}