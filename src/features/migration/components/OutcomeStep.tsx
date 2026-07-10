import Box from '@components/Box'
import Text from '@components/Text'
import React, { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import WorldButton from './WorldButton'

// Shared centered layout for the terminal outcome screens (success / pending /
// partial / nothing-to-migrate): a title, a body line, an optional slot for
// extra content, a primary action and an optional dismiss. Each screen supplies
// its own copy and callbacks — the flow and messaging stay distinct.
const OutcomeStep: FC<{
  title: string
  body: string
  primaryTitle: string
  onPrimary: () => void
  // Omitted on single-action screens (nothing-to-migrate) — the dismiss button
  // is only rendered when a handler is supplied.
  onDismiss?: () => void
  // Rendered between the body and the primary button (e.g. the success screen's
  // new-wallet address line).
  children?: ReactNode
}> = ({ title, body, primaryTitle, onPrimary, onDismiss, children }) => {
  const { t } = useTranslation()
  return (
    <Box flex={1} justifyContent="center" paddingHorizontal="l">
      <Text variant="h4" color="primaryText" textAlign="center">
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
      <WorldButton
        title={primaryTitle}
        onPress={onPrimary}
        marginTop="xl"
        marginBottom="m"
      />
      {onDismiss ? (
        <WorldButton
          variant="secondary"
          title={t('migrateToWorldModal.dismiss')}
          onPress={onDismiss}
        />
      ) : null}
    </Box>
  )
}

export default OutcomeStep
