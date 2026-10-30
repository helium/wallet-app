import fs from 'fs'
import path from 'path'

const SRC = path.resolve(__dirname, '../..')
const MOTION = path.join(SRC, 'theme', 'motion.ts')

// Spring physics written outside the token module.
const INLINE_SPRING =
  /Reanimated3DefaultSpringConfig|\.springify\(|\b(damping|dampingRatio|stiffness|mass|overshootClamping)\s*:/

const sourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : sourceFiles(full)
    }
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })

// The argument text of every withSpring(...) call in the source.
const withSpringArgs = (source: string) => {
  const calls: string[] = []
  let start = source.indexOf('withSpring(')
  while (start !== -1) {
    const open = start + 'withSpring('.length
    let depth = 1
    let i = open
    while (depth > 0 && i < source.length) {
      if (source[i] === '(') depth += 1
      if (source[i] === ')') depth -= 1
      i += 1
    }
    calls.push(source.slice(open, i - 1))
    start = source.indexOf('withSpring(', i)
  }
  return calls
}

describe('spring configs', () => {
  const files = sourceFiles(SRC).filter((file) => file !== MOTION)

  it('keeps spring physics in the motion token module', () => {
    const offenders = files.filter((file) =>
      INLINE_SPRING.test(fs.readFileSync(file, 'utf8')),
    )
    expect(offenders.map((file) => path.relative(SRC, file))).toEqual([])
  })

  it('passes a SPRING token to every withSpring call', () => {
    const offenders = files.flatMap((file) =>
      withSpringArgs(fs.readFileSync(file, 'utf8'))
        .filter((args) => !/,\s*SPRING\.\w+,?\s*$/.test(args))
        .map((args) => `${path.relative(SRC, file)}: withSpring(${args})`),
    )
    expect(offenders).toEqual([])
  })
})
