// World-Light visual tokens for the migration flow (design doc B · World Light).
// The flow is a deliberate light island inside the dark-locked app. Restyle-
// capable props use the `worldSurface`/`worldInk`/`worldPurple` palette entries
// from @theme/theme; the values below are only for props that can't take Restyle
// tokens — TextInput `style`/`placeholderTextColor` and gorhom sheet
// `backgroundStyle`/`handleIndicatorStyle`. Derived from the theme palette so
// there is one source of truth for the hex values.
import { Font, lightThemeColors } from '@theme/theme'

export const WORLD = {
  ink: lightThemeColors.worldInk,
  inkFaint: lightThemeColors.worldInkFaint,
  surface: lightThemeColors.worldSurface,
  // Sheets sit on the white page — a faintly tinted surface + scrim is what
  // reads them as a lifted drawer rather than part of the page.
  sheetSurface: lightThemeColors.worldSurfaceAlt,
  border: lightThemeColors.worldBorder,
} as const

// Shared TextInput text style for the flow's inputs — kept here (not in Restyle)
// because TextInput `style` can't take Restyle tokens. Unifies the login and
// token-amount fields on one family/size/rhythm.
export const WORLD_INPUT = {
  color: WORLD.ink,
  fontFamily: Font.regular,
  fontSize: 16,
  paddingVertical: 14,
} as const

// One set of gorhom sheet chrome styles for every World-Light sheet (the two
// asset edit sheets and the announcement card), so surface, grabber, and corner
// radius can't drift between them. The corner radius lives on the background
// styles because gorhom paints the visible surface with its background
// component — the sheet's `style` prop lands on a transparent container that
// neither draws nor clips, so a radius there has no effect.
export const WORLD_SHEET = {
  background: {
    backgroundColor: WORLD.sheetSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cardBackground: {
    backgroundColor: WORLD.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: { backgroundColor: WORLD.inkFaint },
} as const

// The flow's two title treatments: hero screens (intro, progress, outcomes)
// center a 27pt h3, task screens (connect, select, review, sheets) lead with a
// left-aligned 22pt h4. One tracking value per tier, set here so step files
// stop hand-tuning letterSpacing.
export const WORLD_TRACKING = {
  hero: -0.5,
  title: -0.4,
} as const
