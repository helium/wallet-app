import React, { memo, useState } from 'react'
import { upperCase } from 'lodash'
import { useTranslation } from 'react-i18next'
import Carousel from 'react-native-snap-carousel'
import { useAsync } from 'react-async-hook'
import { useNavigation } from '@react-navigation/native'
import Text from '@components/Text'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import Card from '@components/Card'
import Box from '@components/Box'
import { wp } from '@utils/layout'
import ButtonPressable from '@components/ButtonPressable'
import BackScreen from '@components/BackScreen'
import TextTransform from '@components/TextTransform'
import { getSecureAccount } from '@storage/secureStorage'

const RevealWordsScreen = () => {
  const { currentAccount } = useAccountStorage()
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [mnemonic, setMnemonic] = useState<string[]>()

  useAsync(async () => {
    if (!currentAccount || !currentAccount.address) return
    const secureAccount = await getSecureAccount(currentAccount.address)
    setMnemonic(secureAccount?.mnemonic)
  }, [currentAccount])

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const isFirst = index === 0
    const isLast = index + 1 === mnemonic?.length
    return (
      <Card
        marginHorizontal="s"
        marginLeft={isFirst ? 'l' : undefined}
        marginRight={isLast ? 'l' : undefined}
        variant="elevated"
        flex={1}
        overflow="hidden"
        backgroundColor="surfaceSecondary"
        alignItems="center"
        justifyContent="center"
        flexDirection="row"
      >
        <Text fontSize={39} color="primaryText" maxFontSizeMultiplier={1}>{`${
          index + 1
        }. `}</Text>
        <Text fontSize={39} color="primaryText" maxFontSizeMultiplier={1}>
          {upperCase(item)}
        </Text>
      </Card>
    )
  }

  return (
    <BackScreen backgroundColor="primaryBackground" flex={1}>
      <Box flex={1} />
      <Text variant="h1" maxFontSizeMultiplier={1}>
        {t('settings.revealWords.title', { numWords: mnemonic?.length })}
      </Text>
      <TextTransform
        variant="body1"
        maxFontSizeMultiplier={1}
        marginTop="m"
        i18nKey="settings.revealWords.subtitle"
        values={{ numWords: mnemonic?.length }}
        marginBottom="xl"
      />
      <Box
        marginHorizontal="n_lx"
        height={{ smallPhone: 80, phone: 100 }}
        marginVertical="l"
      >
        <Carousel
          layout="default"
          vertical={false}
          data={mnemonic || []}
          renderItem={renderItem}
          sliderWidth={wp(100)}
          itemWidth={wp(90)}
          inactiveSlideScale={1}
          useExperimentalSnap
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore this is a new beta prop and enforces only scrolling one item at a time
          disableIntervalMomentum
        />
      </Box>
      <Box flex={1} />
      <ButtonPressable
        height={60}
        borderRadius="round"
        backgroundColor="surfaceSecondary"
        titleColor="primaryText"
        title={t('settings.revealWords.next')}
        marginBottom="m"
        onPress={navigation.goBack}
      />
    </BackScreen>
  )
}

export default memo(RevealWordsScreen)
