import React from 'react'
import { StyleSheet, type ViewProps } from 'react-native'
import { type Edge } from 'react-native-safe-area-context'
import { SafeAreaView } from 'react-native-screens/experimental'

const ALL_EDGES: readonly Edge[] = ['top', 'right', 'bottom', 'left']

export type TabSafeAreaViewProps = ViewProps & { edges?: readonly Edge[] }

// Native tabs draw screens under a floating tab bar. The safe-area-context
// SafeAreaView reads the window's insets, so its bottom edge stops at the
// home indicator, under the bar. This one reads the screen's own safe area,
// which includes the bar. Same props as the safe-area-context one.
export const TabSafeAreaView = ({
  edges = ALL_EDGES,
  style,
  ...props
}: TabSafeAreaViewProps) => (
  <SafeAreaView
    {...props}
    edges={Object.fromEntries(edges.map((edge) => [edge, true]))}
    // The screens SafeAreaView fills its parent by default; this one sizes
    // to its content, like the safe-area-context one.
    style={[styles.content, style]}
  />
)

const styles = StyleSheet.create({ content: { flex: 0 } })
