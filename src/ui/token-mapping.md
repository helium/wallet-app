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

| Legacy (`@components`)                                  | Replacement                                           |
| ------------------------------------------------------- | ----------------------------------------------------- |
| `Text`                                                  | `@ui/Text`                                            |
| `Box`, `ImageBox`                                       | React Native `View`, `Image` + `className`            |
| `SafeAreaBox`                                           | `SafeAreaView` from `react-native-safe-area-context`  |
| `TouchableOpacityBox`                                   | `PressableScale` (gate 2) or `Pressable`              |
| `ButtonPressable`                                       | `@ui/Button`                                          |
| `FabButton`                                             | `@ui/Button` with `size="icon"`                       |
| `TextInput`, `TextInput` from `@components`             | `@ui/Input` (`variant="form"` for World's form field) |
| `Box` styled as a card or panel                         | `@ui/Card` (`variant="panel"` for a secondary panel)  |
| `HeliumBottomSheet`, a direct gorhom `BottomSheetModal` | `@ui/Sheet`; present and dismiss it through its ref   |

## Icons

Use `lucide-react-native` for UI glyphs. Wrap a glyph once at module scope
with `withUniwind` from `uniwind`, then set its colour with an `accent-`
class: `<Icon size={16} colorClassName="accent-muted-foreground" />`. World's
default size is 16.

The SVG set in `src/assets/images` sorts into three groups. Confirm each
lucide name visually when you make the swap.

### Swap for lucide

| SVG                                                                              | lucide                                 |
| -------------------------------------------------------------------------------- | -------------------------------------- |
| `account`, `createAccount`, `unknownAccount`                                     | `CircleUser`, `UserPlus`, `CircleHelp` |
| `add`, `plus`                                                                    | `Plus`                                 |
| `addDapp`                                                                        | `SquarePlus`                           |
| `alert`, `warning2`, `customWarning`                                             | `TriangleAlert`                        |
| `arrowRight`, `detailArrow`, `listItemRight`, `carot-right`                      | `ChevronRight`                         |
| `arrowUp`                                                                        | `ArrowUp`                              |
| `backArrow`                                                                      | `ChevronLeft`                          |
| `backspace`                                                                      | `Delete`                               |
| `bluetooth`                                                                      | `Bluetooth`                            |
| `bookmark` / `bookmarkFilled`                                                    | `Bookmark` (filled: `fill` set)        |
| `carot-down`, `carotDownFull`, `chevronDown`, `downArrow`, `remixChevronDown`    | `ChevronDown`                          |
| `remixChevronUp`                                                                 | `ChevronUp`                            |
| `checkIco`, `checkmark`, `blueCheck`                                             | `Check`                                |
| `checkmarkFill`, `paymentSuccess`                                                | `CircleCheck`                          |
| `close`, `closeModal`, `remixCancel`, `remove`                                   | `X`                                    |
| `CloseCircle`, `error`, `fail`, `infoError`, `paymentFailure`, `cancelledCircle` | `CircleX`                              |
| `cog`, `config`                                                                  | `Settings`                             |
| `copyAddress`                                                                    | `Copy`                                 |
| `courthouse`                                                                     | `Landmark`                             |
| `dapp-ellipsis`, `dots`                                                          | `Ellipsis`                             |
| `kabob`                                                                          | `EllipsisVertical`                     |
| `dollar`                                                                         | `DollarSign`                           |
| `earth-globe`, `globe`                                                           | `Globe`                                |
| `externalLink`                                                                   | `ExternalLink`                         |
| `filter`                                                                         | `ListFilter`                           |
| `flag`                                                                           | `Flag`                                 |
| `importIcon`                                                                     | `Import`                               |
| `indentArrow`                                                                    | `CornerDownRight`                      |
| `info`, `questionMark`                                                           | `Info`, `CircleHelp`                   |
| `lightningBolt`                                                                  | `Zap`                                  |
| `link`                                                                           | `Link`                                 |
| `lock`, `lockClosed`                                                             | `Lock`                                 |
| `mapPin`                                                                         | `MapPin`                               |
| `mapUserLocation`                                                                | `LocateFixed`                          |
| `menu`                                                                           | `Menu`                                 |
| `notificationBell`                                                               | `Bell`                                 |
| `payment`, `send`, `txnSend`, `paymentArrow`                                     | `ArrowUpRight`                         |
| `receive`, `txnReceive`                                                          | `ArrowDownLeft`                        |
| `pending`, `circleLoader`                                                        | `Clock`, `LoaderCircle`                |
| `qr`                                                                             | `QrCode`                               |
| `refresh`                                                                        | `RefreshCw`                            |
| `remixArrowRight`                                                                | `ArrowRight`                           |
| `search`                                                                         | `Search`                               |
| `share`, `shareAddress`, `userShare`                                             | `Share`                                |
| `swaps`                                                                          | `ArrowLeftRight`                       |
| `terminal`                                                                       | `SquareTerminal`                       |
| `userStar`, `userX`                                                              | `UserStar`, `UserX`                    |
| `automation`                                                                     | `Repeat`                               |
| `airdrop`                                                                        | `Droplet`                              |
| `stake`                                                                          | `Layers`                               |
| `browseProxies`                                                                  | `Users`                                |
| `collectableIcon`, `nft`                                                         | `Image`                                |
| `swipeIcon`                                                                      | `Hand`                                 |
| `activeCircle`, `majorityCircle`, `minorityCircle`                               | `Circle`, `CircleDot`                  |

### Keep as SVG

Brand, token and illustration art has no lucide equivalent: `anchorAccount`,
`crowdspot`, `dripLogo`, `heliumUpdateIcon`, `hex`, `hnt`, `hotspot`, `iot`,
`iotSymbol`, `keystoneLogo`, `ledger`, `ledger-circle`, `mobile`,
`mobileSymbol`, `rewardBg`, `walletUpdateIcon`. Replace a hard-coded fill with
`currentColor` when a screen needs a token colour.

### Unused

No file imports these. Delete them in the PR that next touches the icon set:
`accountIntroIconOne`, `boxTriangleTop`, `buy`, `crowdspot-question`, `dc`,
`expandedViewIcon`, `helium`, `intro`, `iotCircle`, `iotRewardIcon`,
`listViewIcon`, `mini-icon`, `mobileCircle`, `mobileIcon`, `mobileRewardIcon`,
`multiply`, `notifications`, `solanaCircle`, `tip-up`, `tokenDC`, `tokenHNT`,
`tokenIOT`, `tokenMOBILE`, `tokenSOL`, `tokenSolana`, `trash`, `triangleDown`,
`vote`, `voteChevron`, `warningKeystone`.
