const command_line_color = require('cli-color')

class Logger {
  indentationSpaceCount: number
  mainFunctionName: string
  showDebugOutput: boolean

  constructor (mainFunctionName: string, indentationSpaceCount: number = 2, showDebugOutput: boolean = false) {
    if (showDebugOutput) {
      if (mainFunctionName) {
        console.log(`Main function name set to ${mainFunctionName}. This is used to automatically determine the indentation space for logging.`)
        console.log(`Indentation space count set to ${indentationSpaceCount}`)
      } else {
        console.log('Auto indentation not enabled.')
      }
    }

    this.indentationSpaceCount = indentationSpaceCount
    this.mainFunctionName = mainFunctionName
    this.showDebugOutput = showDebugOutput
  }

  #getStackHeightOfFunctionsWithinSameFile(): number {
    const { stack } = new Error()
    console.log('stack:', stack)

    if (!stack) {
      throw new ReferenceError('The error did not contain the stack required for computing the indentation count')
    }

    const fileNamePattern = new RegExp(`at (Object\\.)?${this.mainFunctionName}.*\\/(.*.js):[\\d]+:[\\d]+\\)`)
    const fileNameMatchResult = fileNamePattern.exec(stack)
    let fileName

    if (!fileNameMatchResult) {
      throw new ReferenceError('Failed to compute indentation from stack')
    } else {
      fileName = fileNameMatchResult[2]
    }

    const validLinesForStackHeightPattern = new RegExp(`at .+${fileName}:[\\d]+:[\\d]+\\)`, 'g')
    return [...stack.matchAll(validLinesForStackHeightPattern)].findIndex((stackLineMatch) => {
      return fileNamePattern.test(stackLineMatch[0])
    }) - 1
  }

  #getIndentation (): string {
    if (!(this.mainFunctionName)) {
      return ''
    }

    return ' '.repeat(this.#getStackHeightOfFunctionsWithinSameFile() * this.indentationSpaceCount)
  }
  
  info (message: string) {
    console.log(command_line_color.cyan(this.#getIndentation() + message))
  }

  error (message: string) {
    console.error(command_line_color.red(this.#getIndentation() + message))
  }

  warn (message: string) {
    console.warn(command_line_color.yellow(this.#getIndentation() + message))
  }
}

module.exports = Logger