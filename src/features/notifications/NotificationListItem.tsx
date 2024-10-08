import React, { useMemo } from 'react'
import { format } from 'date-fns'
import Text from '@components/Text'
import Box from '@components/Box'
import { TouchableOpacityBoxProps } from '@components/TouchableOpacityBox'
import TouchableContainer from '@components/TouchableContainer'
import { Insets } from 'react-native'
import parseMarkup from '../../utils/parseMarkup'
import { Notification } from '../../utils/walletApiV2'

export type NotificationListItemProps = {
  notification: Notification
  viewed?: boolean
  hasDivider?: boolean
  hitSlop?: Insets
} & TouchableOpacityBoxProps

const NotificationListItem = ({
  notification,
  viewed,
  hasDivider,
  ...rest
}: NotificationListItemProps) => {
  const title = useMemo(() => {
    return notification.title
  }, [notification.title])

  const subtitle = useMemo(() => {
    return parseMarkup(notification.body)
  }, [notification.body])

  const time = useMemo(() => {
    const date = new Date(notification.time)
    // To local time
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    return format(date, 'hh:mm a')
  }, [notification.time])

  return (
    <TouchableContainer
      backgroundColor="secondaryBackground"
      flexDirection="row"
      padding="4"
      borderBottomWidth={hasDivider ? 2 : 0}
      borderBottomColor="primaryBackground"
      {...rest}
    >
      <Box marginStart="2" flexGrow={1} flexBasis={0.5} justifyContent="center">
        <Box flexDirection="row" alignItems="center" marginBottom="xs">
          {!viewed && (
            <Box
              borderRadius="full"
              backgroundColor="green.500"
              width={10}
              height={10}
              marginRight="xs"
            />
          )}
          <Text
            variant="textSmMedium"
            color="primaryText"
            adjustsFontSizeToFit
            allowFontScaling
          >
            {title}
          </Text>
        </Box>
        <Text variant="textXsRegular" color="secondaryText" numberOfLines={2}>
          {subtitle}
        </Text>
      </Box>
      <Text
        variant="textXsRegular"
        fontSize={10}
        fontStyle="italic"
        color="secondaryText"
        paddingStart="2"
      >
        {time}
      </Text>
    </TouchableContainer>
  )
}

export default NotificationListItem
