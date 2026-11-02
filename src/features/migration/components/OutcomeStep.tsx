import { Button } from '@ui/Button'
import { Text } from '@ui/Text'
import React, { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Shared centered layout for the terminal outcome screens (success / pending /
// partial / nothing-to-migrate / wallet-create-error): an optional icon, a
// title, a body line, an optional slot for extra content, a primary action, an
// optional secondary action and an optional dismiss. Each screen supplies its
// own copy and callbacks — the flow and messaging stay distinct.
const OutcomeStep: FC<{
  title: string
  body: string
  primaryTitle: string
  onPrimary: () => void
  // Rendered above the title (e.g. the success screen's check badge) so
  // terminal states aren't visually identical re-skins of one another.
  icon?: ReactNode
  // Rendered between the primary button and dismiss (e.g. the wallet-error
  // screen's support link).
  secondaryAction?: { title: string; onPress: () => void }
  // Omitted on single-action screens (nothing-to-migrate) — the dismiss button
  // is only rendered when a handler is supplied.
  onDismiss?: () => void
  dismissTitle?: string
  // Rendered between the body and the primary button (e.g. the success screen's
  // new-wallet address line).
  children?: ReactNode
  // A failed retry's message, shown just above the primary (retry) button.
  error?: string
}> = ({
  title,
  body,
  primaryTitle,
  onPrimary,
  icon,
  secondaryAction,
  onDismiss,
  dismissTitle,
  children,
  error,
}) => {
  const { t } = useTranslation()
  const { top } = useSafeAreaInsets()
  return (
    <View className="flex-1 justify-center px-6" style={{ paddingTop: top }}>
      {icon ? <View className="mb-6 items-center">{icon}</View> : null}
      <Text size="2xl" className="text-center tracking-tight">
        {title}
      </Text>
      <Text className="mt-4 text-center leading-[22px] text-muted-foreground">
        {body}
      </Text>
      {children}
      {error ? (
        <Text size="xs" className="mt-6 text-center text-destructive">
          {error}
        </Text>
      ) : null}
      <Button
        variant="cta"
        size="dashboard"
        className="mb-4 mt-6 w-full"
        onPress={onPrimary}
      >
        {primaryTitle}
      </Button>
      {secondaryAction ? (
        <Button
          variant="secondary"
          size="dashboard"
          className="mb-4 w-full"
          onPress={secondaryAction.onPress}
        >
          {secondaryAction.title}
        </Button>
      ) : null}
      {onDismiss ? (
        <Button
          variant="ghost"
          size="dashboard"
          className="w-full"
          onPress={onDismiss}
        >
          {dismissTitle ?? t('migrateToWorldModal.dismiss')}
        </Button>
      ) : null}
    </View>
  )
}

export default OutcomeStep
