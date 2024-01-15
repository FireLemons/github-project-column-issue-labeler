const Logger = require('../build/logger')
const message = 'Unmistakably unique string S64/]&yeFE@@Z]r1p8cq'

describe('auto indentation', () => {
  beforeEach(() => {
    console.log = jest.fn()
  })

  test('is disabled when the logger is not initialized with a main function name', () => {
    const logger = new Logger()

    logger.info(message)

    expect(console.log.mock.calls[0][0]).toContain(message)
    expect(console.log.mock.calls[0][0]).not.toContain('  ' + message)
  })

  test('indents the amount of spaces specified when creating the Logger instance', () => {
    const logger = new Logger('main', 4)

    function nestedFunction1 () {
      logger.info(message)
    }

    function main () {
      nestedFunction1()
    }

    main()

    expect(console.log.mock.calls[0][0]).toContain('    ' + message)
    expect(console.log.mock.calls[0][0]).not.toContain('    ' + '    ' + message)
  })

  test('indents more the more the logging call is nested in functions', () => {
    const logger = new Logger('main')

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

    expect(console.log.mock.calls[0][0]).toContain('  ' + message)
    expect(console.log.mock.calls[0][0]).not.toContain('  ' + '  ' + message)

    main(2)

    expect(console.log.mock.calls[1][0]).toContain('  ' + '  ' + message)
    expect(console.log.mock.calls[1][0]).not.toContain('  ' + '  ' + '  ' + message)

    main(3)

    expect(console.log.mock.calls[2][0]).toContain('  ' + '  ' + '  ' + message)
    expect(console.log.mock.calls[2][0]).not.toContain('  ' + '  ' + '  ' + '  ' + message)
  })

  test('indents in intervals of spaces specified when creating the Logger instance based on how deep the logging call is nested in functions', () => {
    const logger = new Logger('main', 3)

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

    expect(console.log.mock.calls[0][0]).toContain('   ' + message)
    expect(console.log.mock.calls[0][0]).not.toContain('   ' + '   ' + message)

    main(2)

    expect(console.log.mock.calls[1][0]).toContain('   ' + '   ' + message)
    expect(console.log.mock.calls[1][0]).not.toContain('   ' + '   ' + '   ' + message)

    main(3)

    expect(console.log.mock.calls[2][0]).toContain('   ' + '   ' + '   ' + message)
    expect(console.log.mock.calls[2][0]).not.toContain('   ' + '   ' + '   ' + '   ' + message)
  })
})