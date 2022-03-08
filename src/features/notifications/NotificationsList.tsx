import React, { memo, useCallback, useMemo } from 'react'
import CarotRight from '@assets/images/carot-right.svg'
import { useNavigation } from '@react-navigation/native'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import TouchableHighlightBox from '../../components/TouchableHighlightBox'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { useColors } from '../../theme/themeHooks'
import {
  HELIUM_UPDATES_ITEM,
  NotificationsListNavigationProp,
  WALLET_UPDATES_ITEM,
} from './notificationTypes'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useNotificationsQuery } from '../../generated/graphql'

const NotificationsList = () => {
  const colors = useColors()
  const { t } = useTranslation()
  const navigator = useNavigation<NotificationsListNavigationProp>()
  const { selectedList, setSelectedNotification } = useNotificationStorage()
  const { accounts, currentAccount } = useAccountStorage()

  const { data: notifications } = useNotificationsQuery({
    variables: {
      address: currentAccount?.address || '',
      resource: selectedList,
    },
    skip: !currentAccount?.address,
    fetchPolicy: 'cache-and-network',
  })

  const title = useMemo(() => {
    switch (selectedList) {
      case undefined:
      case WALLET_UPDATES_ITEM:
        return t('notifications.walletUpdates')
      case HELIUM_UPDATES_ITEM:
        return t('notifications.heliumUpdates')
      default:
        return t('notifications.accountUpdates', {
          title:
            accounts && selectedList
              ? accounts[selectedList]?.alias
              : t('generic.account'),
        })
    }
  }, [accounts, selectedList, t])

  const renderItem = useCallback(
    ({ index, item }) => {
      const isFirst = index === 0
      const viewed = true // !!item.viewedAt

      const onItemSelected = () => {
        navigator.navigate('NotificationDetails', { notification: item })
        setSelectedNotification(item)
      }

      return (
        <TouchableHighlightBox
          activeOpacity={0.9}
          borderTopWidth={isFirst ? 1 : 0}
          borderBottomWidth={1}
          borderColor="primaryBackground"
          underlayColor={colors.secondary}
          onPress={onItemSelected}
        >
          <Box flexDirection="row" justifyContent="space-between" padding="m">
            <Box width="85%">
              <Box flexDirection="row" alignItems="center">
                {!viewed && (
                  <Box
                    borderRadius="round"
                    backgroundColor="red500"
                    width={10}
                    height={10}
                    marginRight="xs"
                    marginBottom="xs"
                  />
                )}
                <Text
                  variant="body1"
                  color="white"
                  marginBottom="xs"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {item.title}
                </Text>
              </Box>
              <Text
                variant="body3"
                numberOfLines={2}
                color="surfaceSecondaryText"
                marginBottom="xs"
              >
                {item.body}
              </Text>
              <Text
                variant="body3"
                numberOfLines={2}
                color={!viewed ? 'red500' : 'surfaceSecondaryText'}
              >
                {formatDistanceToNow(parseISO(item.time), {
                  addSuffix: true,
                })}
              </Text>
            </Box>
            <Box alignItems="center" justifyContent="center">
              <CarotRight color={colors.surfaceSecondaryText} />
            </Box>
          </Box>
        </TouchableHighlightBox>
      )
    },
    [
      colors.secondary,
      colors.surfaceSecondaryText,
      navigator,
      setSelectedNotification,
    ],
  )

  const EmptyListView = useCallback(
    () => (
      <Box alignItems="center">
        <Text color="primaryText" marginTop="xl">
          {t('notifications.emptyTitle')}
        </Text>
      </Box>
    ),
    [t],
  )

  return (
    <Box backgroundColor="surfaceSecondary" flex={1}>
      <Text variant="h3" padding="m" marginVertical="s">
        {title}
      </Text>
      <BottomSheetFlatList
        data={notifications?.notifications || []}
        renderItem={renderItem}
        ListEmptyComponent={EmptyListView}
      />
    </Box>
  )
}

export default memo(NotificationsList)
