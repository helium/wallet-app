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
  <Box
    backgroundColor="cardBackground"
    borderRadius="2xl"
    mt="4"
    px="4"
    py="3"
    {...{ gap: 8 }}
  >
    {message && <Text variant="textSmRegular">{message}</Text>}
    {warning && (
      <Text variant="textSmRegular" color="orange.500">
        {warning}
      </Text>
    )}
  </Box>
)
