// The Home token drawer's grab area (DrawerHandle, h-4).
const DRAWER_HANDLE_HEIGHT = 16

// The collapsed Home token drawer shows its handle and the first two token
// rows above the floating tab bar. The rows after them sit behind the bar.
// The row heights are measured, so a token with its locked row and large
// text sizes still fit.
export const collapsedDrawerSnap = ({
  rowHeights: [first, second],
  tabBarInset,
}: {
  rowHeights: readonly [number, number]
  tabBarInset: number
}) => DRAWER_HANDLE_HEIGHT + first + second + tabBarInset

// The heights of the first two tokens, from the list's cell heights in list
// order. A cell not laid out yet counts as one token of the fallback height.
export const firstTwoTokenHeights = (
  cellHeights: ReadonlyArray<number | undefined>,
  fallback: number,
): readonly [number, number] => {
  const tokens: number[] = []
  cellHeights.some((height) => {
    // A token with no balance stays in the list but renders nothing, so its
    // 0-height cell is not a token row.
    if (height !== 0) tokens.push(height ?? fallback)
    return tokens.length === 2
  })
  return [tokens[0] ?? fallback, tokens[1] ?? fallback]
}
