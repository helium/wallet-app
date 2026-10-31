import { Card } from '@ui/Card'
import { Text } from '@ui/Text'
import React from 'react'

interface IMransactionPreviewProps {
  message?: string
  warning?: string
}

export const MessagePreview = ({
  warning,
  message,
}: IMransactionPreviewProps) => (
  <Card className="mt-4 gap-2 px-4 py-3">
    {message && <Text>{message}</Text>}
    {warning && <Text className="text-warning-500">{warning}</Text>}
  </Card>
)
