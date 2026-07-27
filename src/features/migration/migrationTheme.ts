// World-Light visual tokens for the migration flow (design doc B · World Light).
// The flow is a deliberate light island inside the dark-locked app. Restyle-
// capable props use the `worldSurface`/`worldInk`/`worldPurple` palette entries
// from @theme/theme; the values below are only for props that can't take Restyle
// tokens — TextInput `style`/`placeholderTextColor` and gorhom sheet
// `backgroundStyle`/`handleIndicatorStyle`.
export const WORLD = {
  ink: '#17131F',
  inkFaint: '#9A94A6',
  surface: '#FFFFFF',
  // Sheets sit on the white page — a faintly tinted surface + scrim is what
  // reads them as a lifted drawer rather than part of the page.
  sheetSurface: '#F5F3F7',
  border: '#E5E5E5',
} as const

// Shared TextInput text style for the flow's inputs — kept here (not in Restyle)
// because TextInput `style` can't take Restyle tokens. Unifies the login and
// token-amount fields on one size/rhythm.
export const WORLD_INPUT = {
  color: WORLD.ink,
  fontSize: 16,
  paddingVertical: 14,
} as const
