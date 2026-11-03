// The Home token drawer's grab area (DrawerHandle, h-4).
const DRAWER_HANDLE_HEIGHT = 16

// The collapsed Home token drawer shows its handle and the first two token
// rows above the floating tab bar. The rows after them sit behind the bar.
export const collapsedDrawerSnap = ({
  rowHeight,
  tabBarInset,
}: {
  rowHeight: number
  tabBarInset: number
}) => DRAWER_HANDLE_HEIGHT + rowHeight * 2 + tabBarInset
