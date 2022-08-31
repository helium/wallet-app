import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Carousel } from 'react-native-snap-carousel'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import { useSpacing } from '../../theme/themeHooks'
import { wp } from '../../utils/layout'
import OnboardingSegment, {
  OnboardingOpt,
} from '../onboarding/multiAccount/OnboardingSegment'
import AccountHeader from './AccountHeader'

const AccountsCarousel = () => {
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

  const carouselWidths = useMemo(() => {
    const sliderWidth = wp(100)
    const itemWidth = sliderWidth - spacing.lx * 2
    return { sliderWidth, itemWidth }
  }, [spacing.lx])

  const renderCarouselItem = ({ item }: { item: CSAccount | null }) => {
    if (!item) {
      return (
        <OnboardingSegment
          marginTop="s"
          padding="m"
          onSegmentChange={setOnboardingType}
          onboardingType={onboardingType}
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
