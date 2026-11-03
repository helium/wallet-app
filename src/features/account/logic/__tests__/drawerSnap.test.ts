import { collapsedDrawerSnap, firstTwoTokenHeights } from '../drawerSnap'

describe('collapsedDrawerSnap', () => {
  it('shows the handle and the first two measured token rows above the floating tab bar', () => {
    // HNT with its locked row (2 × 72) and the next token (72).
    expect(
      collapsedDrawerSnap({ rowHeights: [144, 72], tabBarInset: 83 }),
    ).toBe(315)
  })

  it('grows with the rows at large text sizes', () => {
    expect(
      collapsedDrawerSnap({ rowHeights: [230, 115], tabBarInset: 83 }),
    ).toBe(444)
  })

  it('shows the handle and two token rows when there is no tab bar inset', () => {
    expect(collapsedDrawerSnap({ rowHeights: [72, 72], tabBarInset: 0 })).toBe(
      160,
    )
  })
})

describe('firstTwoTokenHeights', () => {
  it.each<[(number | undefined)[], [number, number]]>([
    [[], [72, 72]],
    [[144], [144, 72]],
    [
      [144, undefined],
      [144, 72],
    ],
    [
      [144, 0, 144],
      [144, 144],
    ],
    [
      [0, 0, 72],
      [72, 72],
    ],
    [
      [144, 72, 72],
      [144, 72],
    ],
    [
      [undefined, 0, 90],
      [72, 90],
    ],
  ])('takes %j to %j', (cellHeights, expected) => {
    expect(firstTwoTokenHeights(cellHeights, 72)).toEqual(expected)
  })
})
