import Box from '@components/Box'
import Text from '@components/Text'
import React from 'react'
import Alert from '@assets/images/alert.svg'

export const WarningBox = ({
  header,
  body,
}: {
  header: string
  body: string
}) => {
  return (
    <Box
      p="2"
      mb="2"
      backgroundColor="gray.900"
      borderRadius="2xl"
      flexDirection="column"
      alignItems="stretch"
    >
      <Box flexDirection="row" alignItems="center" mb="xs">
        <Box marginRight="xs">
          <Alert width={16} height={16} color="ros.500" />
        </Box>
        <Text variant="textXsBold" color="primaryText">
          {header}
        </Text>
      </Box>
      <Text variant="textXsRegular" color="gray.50">
        {body}
      </Text>
    </Box>
  )
}
