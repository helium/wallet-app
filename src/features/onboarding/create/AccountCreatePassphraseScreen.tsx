import React, { useState, useEffect, useCallback, memo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import Carousel, { Pagination } from 'react-native-snap-carousel'
import { upperCase } from 'lodash'
import Close from '@assets/images/close.svg'
import Box from '../../../components/Box'
import Text from '../../../components/Text'
import { wp } from '../../../utils/layout'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import { useOnboarding } from '../OnboardingProvider'
import ButtonPressable from '../../../components/ButtonPressable'
import { useColors } from '../../../theme/themeHooks'
import { CreateAccountNavigationProp } from './createAccountNavTypes'
import TouchableOpacityBox from '../../../components/TouchableOpacityBox'
import { OnboardingNavigationProp } from '../onboardingTypes'

const AccountCreatePassphraseScreen = () => {
  const { t } = useTranslation()
  const { createSecureAccount, hasAccounts } = useAccountStorage()
  const colors = useColors()
  const {
    setOnboardingData,
    onboardingData: { netType },
  } = useOnboarding()
  const parentNav = useNavigation<OnboardingNavigationProp>()
  const navigation = useNavigation<CreateAccountNavigationProp>()
  const [wordIndex, setWordIndex] = useState(0)
  const [disabled, setDisabled] = useState(true)
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

  const navToTop = useCallback(() => {
    if (hasAccounts) {
      parentNav.popToTop()
    } else {
      parentNav.navigate('CreateImport')
    }
  }, [hasAccounts, parentNav])

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

  return (
    <Box flex={1}>
      <TouchableOpacityBox padding="l" onPress={navToTop} alignItems="flex-end">
        <Close color={colors.primaryText} height={16} width={16} />
      </TouchableOpacityBox>
      <Box flex={1} justifyContent="center">
        <Text variant="h1" textAlign="center" lineHeight={37}>
          {t('accountSetup.passphrase.title')}
        </Text>
        <Text
          variant="subtitle1"
          color="secondaryText"
          textAlign="center"
          marginTop="m"
        >
          {t('accountSetup.passphrase.subtitle1')}
        </Text>
        <Text
          variant="subtitle1"
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
      <Box opacity={disabled ? 0 : 100}>
        <ButtonPressable
          disabled={disabled}
          marginHorizontal="xl"
          marginBottom="xl"
          borderRadius="round"
          borderBottomRightRadius="round"
          backgroundColor="havelockBlue"
          backgroundColorOpacityPressed={0.7}
          titleColor="black900"
          onPress={navNext}
          title={t('accountSetup.passphrase.next')}
        />
      </Box>
    </Box>
  )
}

export default memo(AccountCreatePassphraseScreen)
