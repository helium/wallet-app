import { cardClassName, cardVariants } from '../cardVariants'

describe('cardVariants', () => {
  it('defaults to the dashboard card: white, radius 15, p 16, stat-box shadow', () => {
    expect(cardVariants()).toBe('rounded-[15px] bg-card p-4 shadow-stat-box')
  })

  it('maps variant panel to the PanelCard: secondary, radius 16, px 16 py 15', () => {
    expect(cardVariants({ variant: 'panel' })).toBe(
      'rounded-2xl bg-secondary px-4 py-[15px]',
    )
  })
})

describe('cardClassName', () => {
  it('lets the caller padding win over the variant padding', () => {
    const className = cardClassName(undefined, 'p-2')

    expect(className).toContain('p-2')
    expect(className).not.toContain('p-4')
  })

  it('adds no trailing space without a caller className', () => {
    expect(cardClassName()).toBe(cardClassName().trimEnd())
  })
})
