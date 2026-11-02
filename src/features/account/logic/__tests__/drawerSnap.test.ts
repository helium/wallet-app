import { collapsedDrawerSnap } from '../drawerSnap'

describe('collapsedDrawerSnap', () => {
  it('shows the handle and two token rows above the floating tab bar', () => {
    expect(collapsedDrawerSnap({ rowHeight: 72, tabBarInset: 83 })).toBe(243)
  })

  it('shows the handle and two token rows when there is no tab bar inset', () => {
    expect(collapsedDrawerSnap({ rowHeight: 72, tabBarInset: 0 })).toBe(160)
  })
})
