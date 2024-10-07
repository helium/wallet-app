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
      backgroundColor="cardBackground"
      flexDirection="row"
      padding="4"
      borderBottomWidth={hasDivider ? 2 : 0}
      borderBottomColor="primaryBackground"
      {...rest}
    >
      <Box marginStart="2" flexGrow={1} flexBasis={0.5} justifyContent="center">
        <Text variant="textSmMedium" color="primaryText">
          {url}
        </Text>
      </Box>
    </TouchableContainer>
  )
}

export default BrowserListItem
