import {
  type BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { Button } from '@ui/Button'
import { type ButtonSize, type ButtonVariant } from '@ui/buttonVariants'
import { Card } from '@ui/Card'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { Sheet } from '@ui/Sheet'
import { Text } from '@ui/Text'
import { type TextSize } from '@ui/textVariants'
import * as SplashLib from 'expo-splash-screen'
import {
  ArrowLeftRight,
  Bell,
  ChevronRight,
  Copy,
  Settings,
  Wallet,
} from 'lucide-react-native'
import React, { useEffect, useRef } from 'react'
import { ScrollView, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { withUniwind } from 'uniwind'

// Dev-only screen that shows every @ui variant and size. Each gate PR adds
// its section; the acceptance check is a screenshot review of this screen.
const SIZES: TextSize[] = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl']

const WEIGHTS = [
  'font-light',
  'font-normal',
  'font-medium',
  'font-semibold',
  'font-bold',
  'font-black',
]

const TEXT_COLORS = [
  'text-foreground',
  'text-muted-foreground',
  'text-primary',
  'text-destructive',
  'text-success-700',
  'text-purple-700',
]

const SURFACES = [
  'bg-background border border-border',
  'bg-off-white',
  'bg-card border border-border',
  'bg-secondary',
  'bg-muted',
  'bg-accent',
  'bg-primary',
  'bg-destructive',
]

const BUTTON_VARIANTS: ButtonVariant[] = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'link',
  'destructive',
  'cta',
]

const BUTTON_SIZES: ButtonSize[] = ['sm', 'default', 'lg', 'icon', 'dashboard']

// withUniwind maps `colorClassName` (an `accent-` class) to lucide's `color`.
const ICONS = [ArrowLeftRight, Bell, ChevronRight, Copy, Settings, Wallet].map(
  (icon) => withUniwind(icon),
)

const Section = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <View className="gap-3 rounded-2xl bg-card p-4">
    <Text size="xs" className="font-medium text-muted-foreground uppercase">
      {title}
    </Text>
    {children}
  </View>
)

const UiGalleryScreen = () => {
  useEffect(() => {
    // App.tsx holds the native splash until the app's splash hides it.
    void SplashLib.hideAsync()
  }, [])

  const sheetRef = useRef<BottomSheetModal>(null)

  // The gallery can render outside App.tsx, so it brings its own sheet host.
  return (
    <GestureHandlerRootView className="flex-1">
      <BottomSheetModalProvider>
        <ScrollView
          className="flex-1 bg-off-white"
          contentContainerClassName="gap-4 px-4 pt-16 pb-8"
        >
          <Text size="2xl" className="font-semibold">
            UI gallery
          </Text>

          <Section title="Text sizes">
            {SIZES.map((size) => (
              <Text key={size} size={size}>
                {`${size} The quick brown fox`}
              </Text>
            ))}
          </Section>

          <Section title="Text weights">
            {WEIGHTS.map((weight) => (
              <Text key={weight} size="lg" className={weight}>
                {weight}
              </Text>
            ))}
          </Section>

          <Section title="Text colours">
            {TEXT_COLORS.map((color) => (
              <Text key={color} className={color}>
                {color}
              </Text>
            ))}
          </Section>

          <Section title="Surfaces">
            {SURFACES.map((surface) => (
              <View key={surface} className={`rounded-md p-3 ${surface}`}>
                <Text
                  size="xs"
                  className={
                    surface.startsWith('bg-primary') ||
                    surface.startsWith('bg-destructive')
                      ? 'text-primary-foreground'
                      : undefined
                  }
                >
                  {surface}
                </Text>
              </View>
            ))}
          </Section>

          <Section title="Button variants">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant} onPress={() => {}}>
                {variant}
              </Button>
            ))}
            <Button disabled onPress={() => {}}>
              disabled
            </Button>
          </Section>

          <Section title="Button sizes">
            <View className="flex-row flex-wrap items-center gap-2">
              {BUTTON_SIZES.map((size) => (
                <Button key={size} size={size} onPress={() => {}}>
                  {size === 'icon' ? '+' : size}
                </Button>
              ))}
            </View>
          </Section>

          <Section title="PressableScale">
            <PressableScale
              className="rounded-2xl border border-border bg-background p-4"
              onPress={() => {}}
            >
              <Text>Press and hold: scale 0.97, 120ms</Text>
            </PressableScale>
          </Section>

          <Section title="Input">
            <Input placeholder="default: tap to see the focus ring" />
            <Input variant="form" placeholder="form" />
            <Input editable={false} defaultValue="read-only value" />
          </Section>

          <Section title="Card">
            <Card>
              <Text className="text-muted-foreground">default</Text>
              <Text size="2xl" className="font-semibold">
                1,234.56 HNT
              </Text>
            </Card>
            <Card variant="panel">
              <Text>panel</Text>
            </Card>
          </Section>

          <Section title="Sheet">
            <Button onPress={() => sheetRef.current?.present()}>
              Open sheet
            </Button>
          </Section>

          <Section title="Icons">
            <View className="flex-row gap-4">
              {ICONS.map((Icon, index) => (
                <Icon
                  key={index}
                  size={16}
                  colorClassName="accent-foreground"
                />
              ))}
            </View>
            <View className="flex-row gap-4">
              {ICONS.map((Icon, index) => (
                <Icon
                  key={index}
                  size={24}
                  colorClassName="accent-muted-foreground"
                />
              ))}
            </View>
          </Section>
        </ScrollView>
        <Sheet ref={sheetRef}>
          <BottomSheetView className="gap-3 px-4 pt-2 pb-12">
            <Text size="lg" className="font-semibold">
              Sheet
            </Text>
            <Text className="text-muted-foreground">
              black/50 overlay, 24px top radius, 36x4 grab bar, 300ms.
            </Text>
            <Button onPress={() => sheetRef.current?.dismiss()}>Close</Button>
          </BottomSheetView>
        </Sheet>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}

export default UiGalleryScreen
