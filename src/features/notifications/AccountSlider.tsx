import React, { memo, useCallback, useMemo, useRef } from 'react'
import WalletUpdate from '@assets/images/walletUpdateIcon.svg'
import HeliumUpdate from '@assets/images/heliumUpdateIcon.svg'
import { Carousel } from 'react-native-snap-carousel'
import { StyleSheet } from 'react-native'
import { useAsync } from 'react-async-hook'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import AccountIcon from '../../components/AccountIcon'
import { wp } from '../../utils/layout'
import Box from '../../components/Box'
import AccountSliderIcon from './AccountSliderIcon'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import { HELIUM_UPDATES_ITEM, WALLET_UPDATES_ITEM } from './notificationTypes'
import { isValidAccountHash } from '../../utils/accountUtils'

const AccountSlider = () => {
  const { accounts } = useAccountStorage()
  const carouselRef = useRef<Carousel<string | null>>(null)
  const {
    selectedList,
    updateSelectedList,
    unreadLists,
    openedNotification,
    setOpenedNotification,
  } = useNotificationStorage()

  const { sortedAccounts } = useAccountStorage()

  const data = useMemo(() => {
    const accountsData = accounts ? Object.keys(accounts) : []
    const networkData = [WALLET_UPDATES_ITEM, HELIUM_UPDATES_ITEM]
    const fullList = [...networkData, ...accountsData]
    const filteredList = fullList.filter((i) => !unreadLists.includes(i))
    return [...unreadLists, ...filteredList]
  }, [accounts, unreadLists])

  useAsync(async () => {
    if (openedNotification) {
      // we came from a push notification tap
      const additionalData = openedNotification.additionalData as {
        resource?: string
        id?: number
      }
      const resource = additionalData?.resource
      if (
        resource === WALLET_UPDATES_ITEM ||
        resource === HELIUM_UPDATES_ITEM
      ) {
        // helium or wallet update
        await updateSelectedList(resource)
      } else if (resource !== undefined) {
        // account update, check hash against accounts
        const index = (
          await Promise.all(
            sortedAccounts.map((a) => isValidAccountHash(a.address, resource)),
          )
        ).findIndex((result) => !!result)
        const notifiedAccount = index > -1 ? sortedAccounts[index] : undefined
        if (notifiedAccount && notifiedAccount.address) {
          await updateSelectedList(notifiedAccount.address)
        }
      }
      // clear the opened push notification
      setOpenedNotification(undefined)
    } else {
      // TODO: Double check with team if this is the desired behavior
      // set the selected list as the first account by default, after sorting of data by unread
      // await updateSelectedList(data[0])
    }
  }, [
    data,
    openedNotification,
    setOpenedNotification,
    sortedAccounts,
    updateSelectedList,
  ])

  const onIconSelected = useCallback((index: number) => {
    carouselRef?.current?.snapToItem(index)
  }, [])

  const onSnap = useCallback(
    async (index: number) => {
      updateSelectedList(data[index])
    },
    [data, updateSelectedList],
  )

  const sliderWidth = useMemo(() => wp(100), [])

  const renderItem = useCallback(
    ({ index, item }) => {
      let icon
      if (item === WALLET_UPDATES_ITEM) icon = <WalletUpdate />
      else if (item === HELIUM_UPDATES_ITEM) icon = <HeliumUpdate />
      else icon = <AccountIcon address={item} size={56} />
      return (
        <AccountSliderIcon
          key={item}
          resource={item}
          icon={icon}
          index={index}
          onPress={onIconSelected}
          selected={selectedList === data[index]}
        />
      )
    },
    [data, onIconSelected, selectedList],
  )

  const keyExtractor = useCallback((item) => item || '', [])

  return (
    <Box marginBottom="l" marginTop="m">
      <Carousel
        ref={carouselRef}
        firstItem={selectedList ? data.indexOf(selectedList) : 0}
        onSnapToItem={onSnap}
        layout="default"
        containerCustomStyle={styles.carouselContainer}
        vertical={false}
        data={data}
        renderItem={renderItem}
        sliderWidth={sliderWidth}
        itemWidth={72}
        inactiveSlideScale={1}
        keyExtractor={keyExtractor}
      />
    </Box>
  )
}

const styles = StyleSheet.create({
  carouselContainer: { paddingLeft: 7 },
})

export default memo(AccountSlider)
