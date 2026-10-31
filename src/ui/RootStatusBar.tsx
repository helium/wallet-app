import React from 'react'
import { StatusBar } from 'react-native'

// The app-wide status bar. The app background is light, so the glyphs are
// dark. A screen on a dark surface overrides it with FocusAwareStatusBar.
export const RootStatusBar = () => (
  <StatusBar animated barStyle="dark-content" />
)
