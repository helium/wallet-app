import { checkboxClassName, checkboxVariants } from '../checkboxVariants'

const BASE = 'size-4 items-center justify-center rounded-[4px] border'

describe('checkboxVariants', () => {
  it('draws an unchecked box at 16px, radius 4, with a 1px input border', () => {
    expect(checkboxVariants({ checked: false })).toBe(`${BASE} border-input`)
  })

  it('fills a checked box with primary', () => {
    expect(checkboxVariants({ checked: true })).toBe(
      `${BASE} border-primary bg-primary`,
    )
  })
})

describe('checkboxClassName', () => {
  it('lets the caller margin through and keeps the variant size', () => {
    const className = checkboxClassName(false, 'mr-4')

    expect(className).toContain('mr-4')
    expect(className).toContain('size-4')
  })
})
