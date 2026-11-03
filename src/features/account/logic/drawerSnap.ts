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
