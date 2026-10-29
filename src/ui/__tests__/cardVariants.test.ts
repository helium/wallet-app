import { cardVariants } from '../cardVariants'

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
