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
      p="s"
      mb="s"
      backgroundColor="black650"
      borderRadius="l"
      flexDirection="column"
      alignItems="stretch"
    >
      <Box flexDirection="row" alignItems="center" mb="xs">
        <Box marginRight="xs">
          <Alert width={16} height={16} color="matchaRed500" />
        </Box>
        <Text variant="body3Bold" color="white">
          {header}
        </Text>
      </Box>
      <Text variant="body3" color="grey50">
        {body}
      </Text>
    </Box>
  )
}
