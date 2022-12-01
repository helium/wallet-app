import React, { useMemo } from 'react'
import Text from '../../components/Text'
import Box from '../../components/Box'
import TouchableOpacityBox, {
  TouchableOpacityBoxProps,
} from '../../components/TouchableOpacityBox'
import { Notification } from '../../generated/graphql'
import parseMarkup from '../../utils/parseMarkup'

export type NotificationListItemProps = {
  notification: Notification
  viewed?: boolean
  hasDivider?: boolean
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
    // Get hours with leading zero
    const hours = date.getHours().toString().padStart(2, '0')
    // Get minutes with trailing 0
    const minutes = date.getMinutes().toString().padEnd(2, '0')
    return `${hours}:${minutes}`
  }, [notification.time])

  return (
    <TouchableOpacityBox
      backgroundColor="black700"
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
            variant="body1"
            color="white"
            adjustsFontSizeToFit
            allowFontScaling
            fontSize={15}
          >
            {title}
          </Text>
        </Box>
        <Text
          variant="body3"
          color="secondaryText"
          numberOfLines={2}
          fontSize={12}
        >
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
    </TouchableOpacityBox>
  )
}

export default NotificationListItem
