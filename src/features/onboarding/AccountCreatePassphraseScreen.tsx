import React, { useState, useEffect, useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import Carousel, { Pagination } from 'react-native-snap-carousel'
import { upperCase } from 'lodash'
import { Image } from 'react-native'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { OnboardingNavigationProp } from './onboardingTypes'
import { wp } from '../../utils/layout'
import SafeAreaBox from '../../components/SafeAreaBox'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useOnboarding } from './OnboardingProvider'
import ButtonPressable from '../../components/ButtonPressable'
import { useColors } from '../../theme/themeHooks'

const AccountCreatePassphraseScreen = () => {
  const { t } = useTranslation()
  const { createSecureAccount } = useAccountStorage()
  const colors = useColors()
  const {
    setOnboardingData,
    onboardingData: { netType },
  } = useOnboarding()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const [wordIndex, setWordIndex] = useState(0)
  const [disabled, setDisabled] = useState(true)
  const [confirmedCreate, setConfirmedCreate] = useState(false)
  const [viewedWords, setViewedWords] = useState(new Array(24).fill(false))
  const { result: secureAccount } = useAsync(
    async () => createSecureAccount({ netType, use24Words: true }),
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
        backgroundColor="surfaceSecondary"
        paddingHorizontal="l"
        alignItems="center"
        justifyContent="center"
        flexDirection="row"
        borderRadius="xl"
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

  const confirmCreate = useCallback(() => setConfirmedCreate(true), [])

  return (
    <SafeAreaBox flex={1} backgroundColor="primaryBackground">
      {confirmedCreate ? (
        <Box flex={1} justifyContent="space-between" flexDirection="column">
          <Box>
            <Text variant="h1" textAlign="center" lineHeight={37}>
              {t('accountSetup.passphrase.title')}
            </Text>
            <Text
              variant="body1"
              color="secondaryText"
              textAlign="center"
              marginTop="m"
            >
              {t('accountSetup.passphrase.subtitle1')}
            </Text>
            <Text
              variant="body1"
              color="red500"
              textAlign="center"
              marginTop="m"
            >
              {t('accountSetup.passphrase.subtitle2')}
            </Text>
            <Box height={{ smallPhone: 80, phone: 100 }} marginTop="l">
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
                backgroundColor: colors.primaryText,
              }}
              dotContainerStyle={{ marginHorizontal: 3 }}
              inactiveDotOpacity={0.4}
              inactiveDotScale={1}
            />
          </Box>
          <ButtonPressable
            height={60}
            marginHorizontal="xl"
            marginBottom="m"
            borderRadius="round"
            borderBottomRightRadius="round"
            backgroundColor="havelockBlue"
            titleColor="black900"
            visible={!disabled}
            onPress={navNext}
            title={t('accountSetup.passphrase.next')}
          />
        </Box>
      ) : (
        <>
          <Box justifyContent="center" alignItems="center" flex={1}>
            <Image source={require('@assets/images/newWallet.png')} />
            <Text variant="h2" marginTop="l" textAlign="center" lineHeight={34}>
              {t('accountSetup.title')}
            </Text>
            <Text
              variant="body1"
              textAlign="center"
              color="secondaryText"
              marginVertical="m"
            >
              {t('accountSetup.subtitle1')}
            </Text>
            <Text variant="body1" textAlign="center" color="greenBright500">
              {t('accountSetup.subtitle2')}
            </Text>
          </Box>
          <ButtonPressable
            height={60}
            marginHorizontal="xl"
            marginBottom="m"
            borderRadius="round"
            borderBottomRightRadius="round"
            backgroundColor="surfaceSecondary"
            titleColor="greenBright500"
            title={t('accountSetup.createButtonTitle')}
            onPress={confirmCreate}
          />
        </>
      )}
    </SafeAreaBox>
  )
}

export default AccountCreatePassphraseScreen
