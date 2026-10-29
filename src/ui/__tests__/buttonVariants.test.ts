import { buttonTextVariants, buttonVariants } from '../buttonVariants'

const BASE = 'flex-row items-center justify-center gap-2 rounded-md'

describe('buttonVariants', () => {
  it('defaults to the World primary button at 36px high', () => {
    expect(buttonVariants()).toBe(`${BASE} bg-primary h-9 px-4`)
  })

  it.each([
    ['default', 'bg-primary'],
    ['destructive', 'bg-destructive'],
    ['outline', 'border border-border bg-background'],
    ['secondary', 'bg-secondary'],
    ['ghost', 'bg-transparent'],
    ['link', 'bg-transparent'],
    ['cta', 'bg-purple-700'],
  ] as const)('maps variant %s to %s', (variant, variantClass) => {
    expect(buttonVariants({ variant })).toBe(`${BASE} ${variantClass} h-9 px-4`)
  })

  it.each([
    ['default', 'h-9 px-4'],
    ['sm', 'h-8 gap-1.5 px-3'],
    ['lg', 'h-10 px-6'],
    ['icon', 'size-9'],
    ['dashboard', 'h-[43px] rounded-[30px] px-5'],
  ] as const)('maps size %s to %s', (size, sizeClass) => {
    expect(buttonVariants({ size })).toBe(`${BASE} bg-primary ${sizeClass}`)
  })

  it('dims a disabled button to half opacity', () => {
    expect(buttonVariants({ disabled: true })).toBe(
      `${BASE} bg-primary h-9 px-4 opacity-50`,
    )
  })
})

describe('buttonTextVariants', () => {
  it.each([
    ['default', 'text-primary-foreground'],
    ['destructive', 'text-white'],
    ['outline', 'text-foreground'],
    ['secondary', 'text-secondary-foreground'],
    ['ghost', 'text-foreground'],
    ['link', 'text-primary underline'],
    ['cta', 'text-white'],
  ] as const)('maps variant %s to %s in 14px medium', (variant, textClass) => {
    expect(buttonTextVariants({ variant })).toBe(`font-medium ${textClass}`)
  })
})
