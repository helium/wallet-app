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
      padding="m"
      borderBottomWidth={hasDivider ? 1 : 0}
      borderBottomColor="black"
      {...rest}
    >
      <Box marginStart="s" flexGrow={1} flexBasis={0.5} justifyContent="center">
        <Box flexDirection="row" alignItems="center" marginBottom="xs">
          {!viewed && (
            <Box
              borderRadius="round"
              backgroundColor="malachite"
              width={10}
              height={10}
              marginRight="xs"
            />
          )}
          <Text
            variant="subtitle4"
            color="primaryText"
            adjustsFontSizeToFit
            allowFontScaling
          >
            {title}
          </Text>
        </Box>
        <Text variant="body3" color="secondaryText" numberOfLines={2}>
          {subtitle}
        </Text>
      </Box>
      <Text
        variant="body3"
        fontSize={10}
        fontStyle="italic"
        color="secondaryText"
        paddingStart="s"
      >
        {time}
      </Text>
    </TouchableContainer>
  )
}

export default NotificationListItem
