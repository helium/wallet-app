import { requireNativeView, requireOptionalNativeModule } from 'expo'
import { type ComponentType } from 'react'
import { View, type ViewProps } from 'react-native'

// Hides UIKit's bottom scroll edge effect (iOS 26) on the scroll view inside
// it. Other scroll views keep theirs. iOS only: Android has no edge effect, so
// the module is null there and a plain View stands in.
export const HideBottomEdgeEffect: ComponentType<ViewProps> =
  requireOptionalNativeModule('ScrollEdgeEffect')
    ? requireNativeView('ScrollEdgeEffect')
    : View
