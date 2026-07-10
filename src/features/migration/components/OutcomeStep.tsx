import Box from '@components/Box'
import Text from '@components/Text'
import React, { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import WorldButton from './WorldButton'

// Shared centered layout for the terminal outcome screens (success / pending /
// partial / nothing-to-migrate / wallet-create-error): a title, a body line, an
// optional slot for extra content, a primary action, an optional secondary
// action and an optional dismiss. Each screen supplies its own copy and
// callbacks — the flow and messaging stay distinct.
const OutcomeStep: FC<{
  title: string
  body: string
  primaryTitle: string
  onPrimary: () => void
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
  secondaryAction,
  onDismiss,
  dismissTitle,
  children,
  error,
}) => {
  const { t } = useTranslation()
  return (
    <Box flex={1} justifyContent="center" paddingHorizontal="l">
      <Text variant="h4" color="worldInk" textAlign="center">
        {title}
      </Text>
      <Text
        variant="body2"
        color="secondaryText"
        textAlign="center"
        marginTop="m"
      >
        {body}
      </Text>
      {children}
      {error ? (
        <Text variant="body3" color="error" textAlign="center" marginTop="l">
          {error}
        </Text>
      ) : null}
      <WorldButton
        title={primaryTitle}
        onPress={onPrimary}
        marginTop={error ? 'm' : 'xl'}
        marginBottom="m"
      />
      {secondaryAction ? (
        <WorldButton
          variant="secondary"
          title={secondaryAction.title}
          onPress={secondaryAction.onPress}
          marginBottom="m"
        />
      ) : null}
      {onDismiss ? (
        <WorldButton
          variant="dismiss"
          title={dismissTitle ?? t('migrateToWorldModal.dismiss')}
          onPress={onDismiss}
        />
      ) : null}
    </Box>
  )
}

export default OutcomeStep
