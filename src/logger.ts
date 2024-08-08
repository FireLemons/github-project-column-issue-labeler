import commandLineColor from 'cli-color'

export enum Indentation {
  space = ' ',
  tab = '	'
}

export class Logger {
  baseIndentation: number
  indentationCharacter: string

  constructor (indentationCharacter: Indentation = Indentation.space) {
    this.baseIndentation = 0
    this.indentationCharacter = indentationCharacter
  }

  addBaseIndentation (amount: number) {
    this.baseIndentation = Math.max(0, this.baseIndentation + amount)
    // console.log(`Indentation: ${this.baseIndentation}`)
  }

  info (message: string, indentationCount: number = 0) {
    console.info(this.#makePrettyString(message, 'INFO', this.baseIndentation + indentationCount, commandLineColor.cyan))
  }

  error (message: string, indentationCount: number = 0) {
    console.error(this.#makePrettyString(message, 'FAIL', this.baseIndentation + indentationCount, commandLineColor.red))
  }

  warn (message: string, indentationCount: number = 0) {
    console.warn(this.#makePrettyString(message, 'WARN', this.baseIndentation + indentationCount, commandLineColor.yellow))
  }

  #indentationAmountToString (indentationAmount: number): string {
    return this.indentationCharacter.repeat(indentationAmount)
  }

  #formatSubequentLines (lines: string[], spaceIndentationCount: number, applyColor: (...text: any[]) => string): string {
    if (lines.length === 0) {
      return ''
    }

    const formattedLines = lines.map((line) => {
      return this.#indentationAmountToString(spaceIndentationCount) + applyColor(line)
    })

    formattedLines[0] = '\n' + formattedLines[0]

    return formattedLines.join('\n')
  }

  #makePrettyString (message: string, level: string, spaceIndentationCount: number, applyColor: (...text: any[]) => string): string {
    const messageLines = message.split('\n')

    const firstLineFormatted = applyColor(`${level}: ${this.#indentationAmountToString(spaceIndentationCount)}${messageLines[0]}`)
    const remainingLinesFormatted = this.#formatSubequentLines(messageLines.slice(1), spaceIndentationCount + level.length + 2, applyColor)

    return firstLineFormatted + remainingLinesFormatted
  }
}
