import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Carousel } from 'react-native-snap-carousel'
import TabBar from '../../components/TabBar'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import { useSpacing } from '../../theme/themeHooks'
import { wp } from '../../utils/layout'
import { MultiAccountNavigationProp } from '../onboarding/multiAccount/MultiAccountNavigator'
import { OnboardingOpt } from '../onboarding/multiAccount/OnboardingSegment'
import AccountHeader from './AccountHeader'

const AccountsCarousel = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<MultiAccountNavigationProp>()
  const carouselRef = useRef<Carousel<CSAccount | null>>(null)

  const spacing = useSpacing()

  const [onboardingType, setOnboardingType] = useState<OnboardingOpt>('import')

  const { sortedAccounts, currentAccount, setCurrentAccount } =
    useAccountStorage()

  const carouselData = useMemo(() => {
    return [
      ...sortedAccounts,
      null, // needed for account import/create state
    ]
  }, [sortedAccounts])

  // if carouselData or currentAccount changes, snap to the currentAccount's index
  useEffect(() => {
    if (!currentAccount?.address) return
    const index = carouselData.findIndex(
      (acct) => acct?.address === currentAccount?.address,
    )
    if (index < 0) return
    carouselRef.current?.snapToItem(index)
  }, [carouselData, currentAccount])

  const segmentData = useMemo(() => {
    const data = [
      { value: 'import', title: t('onboarding.import') },
      { value: 'ledger', title: t('onboarding.ledger') },
      { value: 'create', title: t('onboarding.create') },
    ]
    return data
  }, [t])

  const carouselWidths = useMemo(() => {
    const sliderWidth = wp(100)
    const itemWidth = sliderWidth - spacing.lx * 2
    return { sliderWidth, itemWidth }
  }, [spacing.lx])

  const onItemSelected = useCallback(
    (value: string) => {
      const opt = value as OnboardingOpt
      setOnboardingType(opt)

      switch (opt) {
        case 'create':
          navigation.navigate('AccountCreateStart')
          break
        case 'import':
          navigation.navigate('AccountImportStartScreen')
          break
        case 'ledger':
          navigation.navigate('LedgerStart')
          break
      }
    },
    [navigation],
  )

  const renderCarouselItem = ({ item }: { item: CSAccount | null }) => {
    if (!item) {
      return (
        <TabBar
          tabBarOptions={segmentData}
          onItemSelected={onItemSelected}
          selectedValue={onboardingType}
        />
      )
    }
    return <AccountHeader account={item} />
  }

  const onSnapToItem = useCallback(
    (index: number) => {
      setCurrentAccount(carouselData[index])
    },
    [carouselData, setCurrentAccount],
  )

  return (
    <Carousel
      ref={carouselRef}
      layout="default"
      vertical={false}
      data={carouselData}
      renderItem={renderCarouselItem}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...carouselWidths}
      onSnapToItem={onSnapToItem}
    />
  )
}

export default AccountsCarousel
