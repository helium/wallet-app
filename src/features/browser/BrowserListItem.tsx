import React from 'react'
import Text from '@components/Text'
import Box from '@components/Box'
import { TouchableOpacityBoxProps } from '@components/TouchableOpacityBox'
import TouchableContainer from '@components/TouchableContainer'
import { Insets } from 'react-native'

export type ActivityListItemProps = {
  url: string
  hasDivider?: boolean
  hitSlop?: Insets
} & TouchableOpacityBoxProps

const BrowserListItem = ({
  url,
  hasDivider,
  ...rest
}: ActivityListItemProps) => {
  return (
    <TouchableContainer
      backgroundColor="surfaceSecondary"
      flexDirection="row"
      padding="m"
      borderBottomWidth={hasDivider ? 1 : 0}
      borderBottomColor="black"
      {...rest}
    >
      <Box marginStart="s" flexGrow={1} flexBasis={0.5} justifyContent="center">
        <Text variant="subtitle4">{url}</Text>
      </Box>
    </TouchableContainer>
  )
}

export default BrowserListItem
