import { inputVariants } from '../inputVariants'

const BASE = 'w-full py-0 font-normal text-base text-foreground'

describe('inputVariants', () => {
  it('defaults to the shadcn input: 36px high, radius 8, input border, transparent', () => {
    expect(inputVariants()).toBe(
      `${BASE} h-9 rounded-md border border-input bg-transparent px-3 shadow-xs focus:border-ring`,
    )
  })

  it('maps variant form to the 48px pill on off-white with no border', () => {
    expect(inputVariants({ variant: 'form' })).toBe(
      `${BASE} h-12 rounded-full bg-off-white px-5`,
    )
  })
})
