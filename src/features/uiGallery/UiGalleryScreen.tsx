import { Text } from '@ui/Text'
import { type TextSize } from '@ui/textVariants'
import * as SplashLib from 'expo-splash-screen'
import React, { useEffect } from 'react'
import { ScrollView, View } from 'react-native'

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

  return (
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
    </ScrollView>
  )
}

export default UiGalleryScreen
