# Restyle to `@ui` token mapping

Use this table when a feature moves from `@components` and Restyle props to
`@ui` and Uniwind classes. Tokens come from `src/theme/world-theme.css`
(World's `theme.css`, unchanged) and the Figtree block in `src/global.css`.

Rules:

- Use semantic tokens only. Put no hex or rgba value in component code.
- A Restyle colour with no row here has no World token. Use the nearest
  semantic token. If the colour is a brand colour (HNT, MOBILE, IOT, Solana),
  add a token to `theme.css` in the PR that needs it.
- Drop `responsiveFontSize`. Use World's fixed sizes.

## Text variants

`Text` from `@ui/Text` sets `font-normal text-foreground` and `size="sm"` by
default. Sizes are the nearest World step; a tie rounds down.

| Restyle `variant`             | `@ui` `Text`                                |
| ----------------------------- | ------------------------------------------- |
| `h0` (42)                     | `size="4xl"`                                |
| `h1` (37)                     | `size="4xl"`                                |
| `h2` (33)                     | `size="3xl"`                                |
| `h3` (27)                     | `size="2xl"`                                |
| `h4` (22)                     | `size="xl"`                                 |
| `subtitle1` (20)              | `size="xl" className="font-medium"`         |
| `subtitle2` (19)              | `size="lg" className="font-medium"`         |
| `subtitle3` (17)              | `size="base" className="font-medium"`       |
| `subtitle4` (14)              | `className="font-medium"`                   |
| `body0` (21)                  | `size="xl"`                                 |
| `body1` (16)                  | `size="base"`                               |
| `body2` (14)                  | default                                     |
| `body3` (12)                  | `size="xs"`                                 |
| `body4` (8)                   | `className="text-[10px]"`                   |
| `regular` / `medium` / `bold` | `font-normal` / `font-medium` / `font-bold` |
| `<body/h variant>Medium`      | the base row + `font-medium`                |
| `<body/h variant>Bold`        | the base row + `font-bold`                  |
| `color="secondaryText"`       | `className="text-muted-foreground"`         |

## Colours

| Restyle colour                                                                                 | Class                                       |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `primaryText`, `primaryIcon`, `worldInk`                                                       | `text-foreground`                           |
| `secondaryText`, `secondaryIcon`, `surfaceSecondaryText`, `worldSecondaryInk`, `worldInkFaint` | `text-muted-foreground`                     |
| `surfaceText`                                                                                  | `text-card-foreground`                      |
| `primaryBackground`, `primary`                                                                 | `bg-background`                             |
| `secondaryBackground`, `secondary`, `surfaceSecondary`, `worldSurfaceAlt`                      | `bg-secondary`                              |
| `surface`, `worldSurface`                                                                      | `bg-card`                                   |
| `bottomSheetBg`                                                                                | `bg-popover`                                |
| `surfaceContrast` / `surfaceContrastText`                                                      | `bg-primary` / `text-primary-foreground`    |
| `plainInputBackground`, `regularInputBackground`                                               | `border border-input bg-transparent`        |
| `error`, `testnet`, `red500`, `critical500`, `matchaRed500`                                    | `destructive` (`text-`, `bg-`)              |
| `highlight`, `blue500`, `blueBright500`                                                        | `blue-dark-500`                             |
| `green500`, `malachite`                                                                        | `success-500`                               |
| `worldSuccess` / `worldSuccessBg`                                                              | `success-700` / `success-50`                |
| `orange500`, `flamenco`                                                                        | `warning-500`                               |
| `worldWarnInk` / `worldWarnBg`                                                                 | `warning-500` / `warning-100`               |
| `purple500`                                                                                    | `purple-500`                                |
| `worldPurple` / `worldPurpleFaint` / `worldAccentBg`                                           | `purple-700` / `purple-400` / `purple-50`   |
| `worldBorder`, `lightGrey`, `dividerGrey`                                                      | `border-border`                             |
| `grey100`, `offWhite`                                                                          | `bg-off-white`                              |
| `white`                                                                                        | `bg-background` / `text-primary-foreground` |
| `black`, `black*`                                                                              | `bg-primary` / `text-foreground`            |
| `transparent`                                                                                  | `bg-transparent`                            |

## Spacing

Tailwind step `n` is `n × 4px`. Negative keys (`n_m`) take a `-` prefix
(`-mt-4`).

| Restyle | px  | Step  |
| ------- | --- | ----- |
| `none`  | 0   | `0`   |
| `xxxs`  | 1   | `px`  |
| `xxs`   | 2   | `0.5` |
| `xs`    | 4   | `1`   |
| `sx`    | 6   | `1.5` |
| `s`     | 8   | `2`   |
| `ms`    | 12  | `3`   |
| `m`     | 16  | `4`   |
| `lm`    | 20  | `5`   |
| `l`     | 24  | `6`   |
| `lx`    | 28  | `7`   |
| `xl`    | 32  | `8`   |
| `xxl`   | 48  | `12`  |
| `xxxl`  | 60  | `15`  |
| `xxxxl` | 240 | `60`  |

## Radii

World's `theme.css` sets `--radius` to 10px, so `sm`, `md`, `lg` and `xl`
differ from Tailwind's defaults.

| Restyle `borderRadius` | px   | Class            |
| ---------------------- | ---- | ---------------- |
| `none`                 | 0    | `rounded-none`   |
| `s`                    | 4    | `rounded-[4px]`  |
| `ms`                   | 6    | `rounded-sm`     |
| `m`                    | 8    | `rounded-md`     |
| `lm`                   | 10   | `rounded-lg`     |
| `l`                    | 12   | `rounded-[12px]` |
| `lx`                   | 16   | `rounded-2xl`    |
| `xl`                   | 20   | `rounded-[20px]` |
| `xxl`                  | 35   | `rounded-[35px]` |
| `round`                | 9999 | `rounded-full`   |

## Components

| Legacy (`@components`) | Replacement                                          |
| ---------------------- | ---------------------------------------------------- |
| `Text`                 | `@ui/Text`                                           |
| `Box`, `ImageBox`      | React Native `View`, `Image` + `className`           |
| `SafeAreaBox`          | `SafeAreaView` from `react-native-safe-area-context` |
| `TouchableOpacityBox`  | `PressableScale` (gate 2) or `Pressable`             |
| `ButtonPressable`      | `@ui/Button`                                         |
| `FabButton`            | `@ui/Button` with `size="icon"`                      |
