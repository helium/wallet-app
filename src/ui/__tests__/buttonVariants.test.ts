import { buttonClassName, buttonTextVariants } from '../buttonVariants'

const BASE = 'flex-row items-center justify-center gap-2 rounded-md'

describe('buttonClassName', () => {
  it('defaults to the World primary button at 36px high', () => {
    expect(buttonClassName({})).toBe(`${BASE} bg-primary h-9 px-4`)
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
    expect(buttonClassName({ variant })).toBe(
      `${BASE} ${variantClass} h-9 px-4`,
    )
  })

  it.each([
    ['default', `${BASE} bg-primary h-9 px-4`],
    [
      'sm',
      'flex-row items-center justify-center rounded-md bg-primary h-8 gap-1.5 px-3',
    ],
    ['lg', `${BASE} bg-primary h-10 px-6`],
    ['icon', `${BASE} bg-primary size-9`],
    [
      'dashboard',
      'flex-row items-center justify-center gap-2 bg-primary h-[43px] rounded-[30px] px-5',
    ],
  ] as const)('maps size %s to %s', (size, expected) => {
    expect(buttonClassName({ size })).toBe(expected)
  })

  it('dims a disabled button to half opacity', () => {
    expect(buttonClassName({ disabled: true })).toBe(
      `${BASE} bg-primary h-9 px-4 opacity-50`,
    )
  })

  it('lets a caller className replace the conflicting variant classes', () => {
    const merged = buttonClassName({}, 'bg-destructive rounded-full')
    expect(merged).toContain('bg-destructive rounded-full')
    expect(merged).not.toContain('bg-primary')
    expect(merged).not.toContain('rounded-md')
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
