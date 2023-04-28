import React, { memo, useCallback, useMemo, useRef } from 'react'
import WalletUpdate from '@assets/images/walletUpdateIcon.svg'
import HeliumUpdate from '@assets/images/heliumUpdateIcon.svg'
import { Carousel } from 'react-native-snap-carousel'
import { StyleSheet } from 'react-native'
import { useAsync } from 'react-async-hook'
import AccountIcon from '@components/AccountIcon'
import Box from '@components/Box'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { wp } from '../../utils/layout'
import AccountSliderIcon from './AccountSliderIcon'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import { HELIUM_UPDATES_ITEM, WALLET_UPDATES_ITEM } from './notificationTypes'
import { isValidAccountHash } from '../../utils/accountUtils'

const AccountSlider = () => {
  const carouselRef = useRef<Carousel<string | null>>(null)
  const {
    selectedList,
    updateSelectedList,
    openedNotification,
    setOpenedNotification,
  } = useNotificationStorage()

  const { sortedAccounts, currentAccount } = useAccountStorage()

  const data = useMemo(() => {
    const allAccounts = sortedAccounts.map((a) => a.address)
    const networkData = [WALLET_UPDATES_ITEM, HELIUM_UPDATES_ITEM]
    const index = allAccounts.findIndex((a) => a === currentAccount?.address)
    if (index !== -1) {
      // put the currently selected account first
      allAccounts.unshift(allAccounts.splice(index, 1)[0])
    }
    return [...networkData, ...allAccounts]
  }, [currentAccount?.address, sortedAccounts])

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
        updateSelectedList(resource)
      } else if (resource !== undefined) {
        // account update, check hash against accounts
        const index = (
          await Promise.all(
            sortedAccounts.map((a) => isValidAccountHash(a.address, resource)),
          )
        ).findIndex((result) => !!result)
        const notifiedAccount = index > -1 ? sortedAccounts[index] : undefined
        if (notifiedAccount && notifiedAccount.address) {
          updateSelectedList(notifiedAccount.address)
        }
      }
      // clear the opened push notification
      setOpenedNotification(undefined)
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
