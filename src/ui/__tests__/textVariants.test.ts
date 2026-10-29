import { textVariants } from '../textVariants'

describe('textVariants', () => {
  it('defaults to Figtree regular, foreground colour and World body size', () => {
    expect(textVariants()).toBe('font-normal text-foreground text-sm')
  })

  it.each([
    ['xs', 'text-xs'],
    ['sm', 'text-sm'],
    ['base', 'text-base'],
    ['lg', 'text-lg'],
    ['xl', 'text-xl'],
    ['2xl', 'text-2xl'],
    ['3xl', 'text-3xl'],
    ['4xl', 'text-4xl'],
  ] as const)('maps size %s to %s', (size, sizeClass) => {
    expect(textVariants({ size })).toBe(
      `font-normal text-foreground ${sizeClass}`,
    )
  })
})
