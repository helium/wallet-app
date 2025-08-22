import Box from '@components/Box'
import Text from '@components/Text'
import React from 'react'

interface IMransactionPreviewProps {
  message?: string
  warning?: string
}

export const MessagePreview = ({
  warning,
  message,
}: IMransactionPreviewProps) => (
  <Box backgroundColor="surface" borderRadius="l" mt="m" px="m" py="ms" gap="s">
    {message && <Text variant="body2">{message}</Text>}
    {warning && (
      <Text variant="body2" color="orange500">
        {warning}
      </Text>
    )}
  </Box>
)
