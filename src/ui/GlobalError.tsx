import useCopyText from '@hooks/useCopyText'
import { Copy } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { Button } from './Button'
import { buttonTextVariants } from './buttonVariants'
import { Text } from './Text'

const SafeArea = withUniwind(SafeAreaView)
const CopyIcon = withUniwind(Copy)

// The ErrorBoundary fallback. index.js renders it inside a SafeAreaProvider
// only, so it uses no app context beyond safe area, i18n and useCopyText.
export const GlobalError = ({
  error,
  resetErrorBoundary,
}: {
  error: Error
  resetErrorBoundary: () => void
}) => {
  const { t } = useTranslation()
  const copyText = useCopyText({ haptic: false })
  const text = `${error.message}\n${error.stack}`
  const handleCopyError = () => {
    copyText({
      message: t('generic.toClipboard'),
      copyText: text,
    })
  }
  return (
    <SafeArea className="flex-1 bg-secondary">
      <View className="flex-1 items-center justify-center">
        <Text size="4xl" className="font-medium">
          {t('crash.title')}
        </Text>
        <Text size="base" className="mb-6 mt-2">
          {t('crash.subTitle')}
        </Text>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="grow"
        >
          <Text size="xs" className="font-bold text-destructive">
            {error.message}
          </Text>
          <Text size="xs" className="text-destructive">
            {error.stack}
          </Text>
        </ScrollView>
        <Button
          variant="outline"
          size="dashboard"
          className="mb-2 mt-4 w-full"
          onPress={handleCopyError}
        >
          <CopyIcon size={16} colorClassName="accent-foreground" />
          <Text className={buttonTextVariants({ variant: 'outline' })}>
            {t('generic.copyToClipboard')}
          </Text>
        </Button>
        <Button
          variant="cta"
          size="dashboard"
          className="w-full"
          onPress={resetErrorBoundary}
        >
          {t('crash.resetApp')}
        </Button>
      </View>
    </SafeArea>
  )
}
