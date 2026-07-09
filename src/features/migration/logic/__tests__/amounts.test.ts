import { rawToUi, uiToRaw } from '../amounts'

describe('uiToRaw', () => {
  it('converts a whole number', () => {
    expect(uiToRaw('142', 9)).toBe('142000000000')
  })
  it('converts a fractional amount without float drift', () => {
    expect(uiToRaw('142.5', 9)).toBe('142500000000')
  })
  it('truncates excess precision beyond decimals', () => {
    expect(uiToRaw('0.1234567891', 9)).toBe('123456789')
  })
  it('handles decimals = 0', () => {
    expect(uiToRaw('5000', 0)).toBe('5000')
  })
  it('handles a leading-dot value', () => {
    expect(uiToRaw('.5', 6)).toBe('500000')
  })
  it('returns 0 for empty/zero', () => {
    expect(uiToRaw('', 9)).toBe('0')
    expect(uiToRaw('0', 9)).toBe('0')
  })
})

describe('rawToUi', () => {
  it('round-trips a fractional amount', () => {
    expect(rawToUi('142500000000', 9)).toBe('142.5')
  })
  it('strips trailing zeros', () => {
    expect(rawToUi('142000000000', 9)).toBe('142')
  })
  it('handles sub-one amounts', () => {
    expect(rawToUi('123456789', 9)).toBe('0.123456789')
  })
  it('handles decimals = 0', () => {
    expect(rawToUi('5000', 0)).toBe('5000')
  })
})
