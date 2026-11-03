import React from 'react'
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native'
import { type Edge } from 'react-native-safe-area-context'
import { SafeAreaView } from 'react-native-screens/experimental'

const ALL_EDGES: readonly Edge[] = ['top', 'right', 'bottom', 'left']

// The style keys that lay out the children. They go on the inner
// SafeAreaView; every other key goes on the outer View.
const CONTENT_STYLE_KEYS = new Set<string>([
  'padding',
  'paddingHorizontal',
  'paddingVertical',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingStart',
  'paddingEnd',
  'paddingBlock',
  'paddingBlockStart',
  'paddingBlockEnd',
  'paddingInline',
  'paddingInlineStart',
  'paddingInlineEnd',
  'flexDirection',
  'alignItems',
  'justifyContent',
  'alignContent',
  'flexWrap',
  'gap',
  'rowGap',
  'columnGap',
])

const splitStyle = (style: ViewProps['style']) => {
  const outer: Record<string, unknown> = {}
  const inner: Record<string, unknown> = {}
  Object.entries(StyleSheet.flatten(style) ?? {}).forEach(([key, value]) => {
    if (CONTENT_STYLE_KEYS.has(key)) inner[key] = value
    else outer[key] = value
  })
  return { outer: outer as ViewStyle, inner: inner as ViewStyle }
}

export type TabSafeAreaViewProps = ViewProps & { edges?: readonly Edge[] }

// Native tabs draw screens under a floating tab bar. The safe-area-context
// SafeAreaView reads the window's insets, so its bottom edge stops at the
// home indicator, under the bar. The screens SafeAreaView reads the screen's
// own safe area, which includes the bar, but it applies the insets as margin,
// so its own background does not paint the inset strips. The style is split:
// the outer View takes the background, border, margin and sizing and paints
// the inset strips; the inner SafeAreaView takes the padding and the layout
// classes, so they apply to the children. Same props as the
// safe-area-context one.
export const TabSafeAreaView = ({
  edges = ALL_EDGES,
  style,
  children,
  ...props
}: TabSafeAreaViewProps) => {
  const { outer, inner } = splitStyle(style)

  return (
    // The outer View sizes to its content unless the caller gives it a flex,
    // like the safe-area-context one.
    <View {...props} style={[styles.outer, outer]}>
      <SafeAreaView
        edges={Object.fromEntries(edges.map((edge) => [edge, true]))}
        style={[inner, styles.inner]}
      >
        {children}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: { flex: 0 },
  // The screens SafeAreaView puts flex: 1 before this style. A positive flex
  // sets the flex basis to 0, so in a parent that sizes to its content the
  // children collapse and the inset margin is all that is left. flex: 0
  // clears it, so the basis is the content again. flexBasis: 'auto' does
  // not, because Yoga reads auto as unset.
  inner: { flex: 0, flexGrow: 1, flexShrink: 1 },
})
