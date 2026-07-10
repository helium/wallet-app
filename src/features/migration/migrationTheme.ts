// World-Light visual tokens for the migration flow (design doc B · World Light).
// Only the values consumed by TextInput `style`/`placeholderTextColor` props
// live here — those can't take Restyle color props. Everything Restyle-capable
// uses palette entries from @theme/theme instead.
export const WORLD = {
  ink: '#17131F',
  inkFaint: '#9A94A6',
} as const

// Shared TextInput text style for the flow's inputs — kept here (not in Restyle)
// because TextInput `style` can't take Restyle tokens. Unifies the login and
// token-amount fields on one size/rhythm.
export const WORLD_INPUT = {
  color: WORLD.ink,
  fontSize: 16,
  paddingVertical: 14,
} as const
