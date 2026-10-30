import { inputClassName, inputVariants } from '../inputVariants'

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

describe('inputClassName', () => {
  it('lets the caller height win over the variant height', () => {
    const className = inputClassName(undefined, 'h-8')

    expect(className).toContain('h-8')
    expect(className).not.toContain('h-9')
  })

  it('adds no trailing space without a caller className', () => {
    expect(inputClassName()).toBe(inputClassName().trimEnd())
  })
})
