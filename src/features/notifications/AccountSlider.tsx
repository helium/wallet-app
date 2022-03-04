import React, { memo, useCallback, useMemo, useRef } from 'react'
import WalletUpdate from '@assets/images/walletUpdateIcon.svg'
import HeliumUpdate from '@assets/images/heliumUpdateIcon.svg'
import { Carousel } from 'react-native-snap-carousel'
import { StyleSheet } from 'react-native'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import AccountIcon from '../../components/AccountIcon'
import { wp } from '../../utils/layout'
import Box from '../../components/Box'
import AccountSliderIcon from './AccountSliderIcon'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import { HELIUM_UPDATES_ITEM, WALLET_UPDATES_ITEM } from './notificationTypes'

const AccountSlider = () => {
  const { accounts } = useAccountStorage()
  const carouselRef = useRef<Carousel<string | null>>(null)
  const { selectedList, updateSelectedList } = useNotificationStorage()

  const data = useMemo(() => {
    const accountsData = accounts ? Object.keys(accounts) : []
    const networkData = [WALLET_UPDATES_ITEM, HELIUM_UPDATES_ITEM]
    return [...networkData, ...accountsData]
  }, [accounts])

  const onIconSelected = useCallback((index: number) => {
    carouselRef?.current?.snapToItem(index)
  }, [])

  const onSnap = useCallback(
    async (index: number) => {
      await updateSelectedList(data[index])
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
          icon={icon}
          index={index}
          onPress={onIconSelected}
          hasUnread={false}
        />
      )
    },
    [onIconSelected],
  )

  return (
    <Box height={56} marginBottom="l" marginTop="m">
      <Carousel
        ref={carouselRef}
        firstItem={data.indexOf(selectedList)}
        onSnapToItem={onSnap}
        layout="default"
        containerCustomStyle={styles.carouselContainer}
        vertical={false}
        data={data}
        renderItem={renderItem}
        sliderWidth={sliderWidth}
        itemWidth={72}
        inactiveSlideScale={1}
      />
    </Box>
  )
}

const styles = StyleSheet.create({
  carouselContainer: { paddingLeft: 7 },
})

export default memo(AccountSlider)
