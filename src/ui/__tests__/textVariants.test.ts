import { textClassName } from '../textVariants'

describe('textClassName', () => {
  it('defaults to Figtree regular, foreground colour and World body size', () => {
    expect(textClassName()).toBe('font-normal text-foreground text-sm')
  })

  it('replaces the default weight with a caller weight', () => {
    const classes = textClassName(undefined, 'font-medium').split(' ')
    expect(classes).toContain('font-medium')
    expect(classes).not.toContain('font-normal')
  })

  it('replaces the default colour with a caller colour', () => {
    const classes = textClassName(undefined, 'text-destructive').split(' ')
    expect(classes).toContain('text-destructive')
    expect(classes).not.toContain('text-foreground')
  })

  it.each(['text-lg', 'text-[10px]'])(
    'replaces the default size with a caller size %s',
    (sizeClass) => {
      const classes = textClassName(undefined, sizeClass).split(' ')
      expect(classes).toContain(sizeClass)
      expect(classes).not.toContain('text-sm')
    },
  )

  it('maps the size prop to its size class', () => {
    const classes = textClassName('lg').split(' ')
    expect(classes).toContain('text-lg')
    expect(classes).not.toContain('text-sm')
  })

  it('keeps every default beside a non-conflicting caller class', () => {
    expect(textClassName(undefined, 'uppercase')).toBe(
      'font-normal text-foreground text-sm uppercase',
    )
  })
})
