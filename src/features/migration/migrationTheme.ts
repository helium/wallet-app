// World-Light visual tokens for the migration flow (design doc B · World Light).
// Only the values consumed by TextInput `style`/`placeholderTextColor` props
// live here — those can't take Restyle color props. Everything Restyle-capable
// uses palette entries from @theme/theme instead.
export const WORLD = {
  ink: '#17131f',
  inkFaint: '#9a94a6',
} as const
