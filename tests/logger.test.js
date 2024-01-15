const Logger = require('../build/logger')
const message = 'Unmistakably unique string S64/]&yeFE@@Z]r1p8cq'

describe('auto indentation', () => {
  test('is disabled when the logger is not initialized with a main function name', () => {
    console.log = jest.fn()
    const logger = new Logger()

    logger.info(message)

    expect(console.log.mock.calls[0][0]).toContain(message)
    expect(console.log.mock.calls[0][0]).not.toContain('  ' + message)
  })

  test('indents the amount of spaces specified when creating the Logger instance', () => {
    console.warn = jest.fn()
    const indentationLength = 4
    const indentation = ' '.repeat(indentationLength)
    const logger = new Logger('main', indentationLength)

    function nestedFunction1 () {
      logger.warn(message)
    }

    function main () {
      nestedFunction1()
    }

    main()

    expect(console.warn.mock.calls[0][0]).toContain(indentation + message)
    expect(console.warn.mock.calls[0][0]).not.toContain(indentation + indentation + message)
  })

  test('indents more the more the logging call is nested in functions', () => {
    console.error = jest.fn()
    const logger = new Logger('main')

    function nestDepth1 () {
      logger.error(message)
    }

    function nestDepth2 () {
      nestDepth1()
    }

    function nestDepth3 () {
      nestDepth2()
    }

    function main (nestLevel) {
      switch (nestLevel) {
        case 1:
          nestDepth1()
          break
        case 2:
          nestDepth2()
          break
        case 3:
          nestDepth3()
          break
      }
    }

    main(1)

    expect(console.error.mock.calls[0][0]).toContain('  ' + message)
    expect(console.error.mock.calls[0][0]).not.toContain('  ' + '  ' + message)

    main(2)

    expect(console.error.mock.calls[1][0]).toContain('  ' + '  ' + message)
    expect(console.error.mock.calls[1][0]).not.toContain('  ' + '  ' + '  ' + message)

    main(3)

    expect(console.error.mock.calls[2][0]).toContain('  ' + '  ' + '  ' + message)
    expect(console.error.mock.calls[2][0]).not.toContain('  ' + '  ' + '  ' + '  ' + message)
  })

  test('indents in intervals of spaces specified when creating the Logger instance based on how deep the logging call is nested in functions', () => {
    console.log = jest.fn()
    const indentationLength = 3
    const indentation = ' '.repeat(indentationLength)
    const logger = new Logger('main', indentationLength)

    function nestDepth1 () {
      logger.info(message)
    }

    function nestDepth2 () {
      nestDepth1()
    }

    function nestDepth3 () {
      nestDepth2()
    }

    function main (nestLevel) {
      switch (nestLevel) {
        case 1:
          nestDepth1()
          break
        case 2:
          nestDepth2()
          break
        case 3:
          nestDepth3()
          break
      }
    }

    main(1)

    expect(console.log.mock.calls[0][0]).toContain(indentation + message)
    expect(console.log.mock.calls[0][0]).not.toContain(indentation + indentation + message)

    main(2)

    expect(console.log.mock.calls[1][0]).toContain(indentation + indentation + message)
    expect(console.log.mock.calls[1][0]).not.toContain(indentation + indentation + indentation + message)

    main(3)

    expect(console.log.mock.calls[2][0]).toContain(indentation + indentation + indentation + message)
    expect(console.log.mock.calls[2][0]).not.toContain(indentation + indentation + indentation + indentation + message)
  })
})