import {
  buttonClassName,
  buttonPressFeedback,
  buttonTextVariants,
} from '../buttonVariants'

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
    ['dashboardPrimary', 'bg-black'],
    ['dashboardSecondary', 'bg-off-white'],
    ['dashboardFaint', 'bg-off-white'],
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

  it("renders a cta dashboard button as World's 43px purple pill", () => {
    expect(buttonClassName({ variant: 'cta', size: 'dashboard' })).toBe(
      'flex-row items-center justify-center gap-2 bg-purple-700 h-[43px] rounded-[30px] px-5',
    )
  })

  it('dims a disabled button to half opacity', () => {
    expect(buttonClassName({ disabled: true })).toBe(
      `${BASE} bg-primary h-9 px-4 opacity-50`,
    )
  })

  it("fills a disabled cta with World's purple-400 at full opacity", () => {
    const disabledCta = buttonClassName({
      variant: 'cta',
      size: 'dashboard',
      disabled: true,
    })
    expect(disabledCta.split(' ')).toEqual(
      expect.arrayContaining(['bg-purple-400', 'h-[43px]', 'rounded-[30px]']),
    )
    expect(disabledCta).not.toContain('bg-purple-700')
    expect(disabledCta).not.toContain('opacity-50')
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
    ['cta', 'leading-normal text-white'],
    ['dashboardPrimary', 'text-white'],
    ['dashboardSecondary', 'text-off-white-foreground'],
    ['dashboardFaint', 'text-off-white-foreground-faint'],
  ] as const)('maps variant %s to %s in 14px medium', (variant, textClass) => {
    expect(buttonTextVariants({ variant })).toBe(`font-medium ${textClass}`)
  })
})

describe('buttonPressFeedback', () => {
  it('fades a link, since links keep opacity feedback', () => {
    expect(buttonPressFeedback('link')).toBe('opacity')
  })

  it.each([
    [undefined],
    ['default'],
    ['destructive'],
    ['outline'],
    ['secondary'],
    ['ghost'],
    ['cta'],
    ['dashboardPrimary'],
    ['dashboardSecondary'],
    ['dashboardFaint'],
  ] as const)('scales variant %s', (variant) => {
    expect(buttonPressFeedback(variant)).toBe('scale')
  })
})
