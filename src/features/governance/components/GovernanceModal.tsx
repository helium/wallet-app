import { Portal } from '@gorhom/portal'
import { FADE_IN } from '@theme/motion'
import { PressableScale } from '@ui/PressableScale'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { BlurView } from 'expo-blur'
import { X } from 'lucide-react-native'
import React, { ReactNode } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { type Edge } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)
const SafeArea = withUniwind(TabSafeAreaView)
const CloseIcon = withUniwind(X)

type Props = {
  children: ReactNode
  onClose?: () => void
  edges?: Edge[]
}

// Full-screen blurred overlay for the governance position modals. It renders
// in the GovernancePortalHost of GovernanceWrapper, so every caller must sit
// under GovernanceWrapper. A navigation hook in content there gets the
// Governance tab's navigation, not the stack's: call no navigation hook in
// the content.
export const GovernanceModal = ({
  children,
  onClose,
  edges = ['top'],
}: Props) => (
  <Portal hostName="GovernancePortalHost">
    {/* Android has no reliable blur: put an opaque background under it. */}
    {Platform.OS === 'android' && (
      <View className="absolute inset-0 bg-background" />
    )}
    <AnimatedBlurView
      entering={FADE_IN}
      style={StyleSheet.absoluteFill}
      tint="light"
      intensity={80}
    >
      <SafeArea edges={edges} className="mx-2 flex-1 p-4">
        {onClose && (
          <View className="flex-row justify-end pb-2">
            <PressableScale
              onPress={onClose}
              hitSlop={16}
              feedback="opacity"
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <CloseIcon size={24} colorClassName="accent-foreground" />
            </PressableScale>
          </View>
        )}
        {children}
      </SafeArea>
    </AnimatedBlurView>
  </Portal>
)
