import React, { useState, useEffect, useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import Carousel, { Pagination } from 'react-native-snap-carousel'
import { upperCase } from 'lodash'
import { Button } from 'react-native'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { OnboardingNavigationProp } from './onboardingTypes'
import { wp } from '../../utils/layout'
import SafeAreaBox from '../../components/SafeAreaBox'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useOnboarding } from './OnboardingProvider'

const AccountCreatePassphraseScreen = () => {
  const { t } = useTranslation()
  const { createSecureAccount } = useAccountStorage()
  const {
    onboardingData: { netType },
    setOnboardingData,
  } = useOnboarding()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const [wordIndex, setWordIndex] = useState(0)
  const [disabled, setDisabled] = useState(true)
  const [viewedWords, setViewedWords] = useState(new Array(24).fill(false))
  const { result: secureAccount } = useAsync(
    async () => createSecureAccount(null, netType, true),
    [createSecureAccount, netType],
  )

  const onSnapToItem = useCallback(
    (index: number) => {
      setWordIndex(index)
      setViewedWords(
        Object.assign(new Array(24).fill(false), viewedWords, {
          0: true,
          [index]: true,
        }),
      )
    },
    [viewedWords],
  )

  useEffect(() => {
    const viewedAll = viewedWords.every((w) => w)
    if (!viewedAll && !__DEV__) return

    setDisabled(false)
  }, [viewedWords])

  const navNext = useCallback(() => {
    if (!secureAccount) return

    setOnboardingData((prev) => ({ ...prev, secureAccount }))
    navigation.navigate('AccountEnterPassphraseScreen')
  }, [navigation, secureAccount, setOnboardingData])

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const isFirst = index === 0
    const isLast = index + 1 === secureAccount?.mnemonic?.length
    return (
      <Box
        marginHorizontal="s"
        marginLeft={isFirst ? 'l' : undefined}
        marginRight={isLast ? 'l' : undefined}
        flex={1}
        overflow="hidden"
        backgroundColor="surface"
        paddingHorizontal="l"
        alignItems="center"
        flexDirection="row"
        borderRadius="m"
      >
        <Text variant="h1" color="primaryText" maxFontSizeMultiplier={1}>{`${
          index + 1
        }. `}</Text>
        <Text variant="h1" color="primaryText" maxFontSizeMultiplier={1}>
          {upperCase(item)}
        </Text>
      </Box>
    )
  }

  return (
    <SafeAreaBox flex={1} backgroundColor="primaryBackground">
      <Box height={{ smallPhone: 90, phone: 114 }} marginTop="l">
        <Carousel
          layout="default"
          vertical={false}
          data={secureAccount?.mnemonic || []}
          renderItem={renderItem}
          sliderWidth={wp(100)}
          itemWidth={wp(90)}
          inactiveSlideScale={1}
          onScrollIndexChanged={onSnapToItem}
          useExperimentalSnap
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore this is a new beta prop and enforces only scrolling one item at a time
          disableIntervalMomentum
        />
      </Box>
      <Pagination
        dotsLength={secureAccount?.mnemonic.length || 0}
        activeDotIndex={wordIndex}
        dotStyle={{
          width: 6,
          height: 6,
          borderRadius: 3,
        }}
        dotContainerStyle={{ marginHorizontal: 3 }}
        inactiveDotOpacity={0.4}
        inactiveDotScale={1}
      />
      <Button
        disabled={disabled}
        onPress={navNext}
        title={t('accountSetup.passphrase.next')}
      />
    </SafeAreaBox>
  )
}

export default AccountCreatePassphraseScreen
