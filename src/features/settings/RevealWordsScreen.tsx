import React, { memo, useCallback, useMemo, useState } from 'react'
import { upperCase } from 'lodash'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import { useNavigation } from '@react-navigation/native'
import Text from '@components/Text'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import BackScreen from '@components/BackScreen'
import TextTransform from '@components/TextTransform'
import { getSecureAccount } from '@storage/secureStorage'
import { FlatList } from 'react-native'
import { useColors, useSpacing } from '@theme/themeHooks'
import CopyAddress from '@assets/images/copyAddress.svg'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import useCopyText from '@hooks/useCopyText'
import useHaptic from '@hooks/useHaptic'

const RevealWordsScreen = () => {
  const { currentAccount } = useAccountStorage()
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [mnemonic, setMnemonic] = useState<string[]>()
  const spacing = useSpacing()
  const { secondaryText } = useColors()
  const copyText = useCopyText()
  const { triggerImpact } = useHaptic()

  const handleCopySeedPhrase = useCallback(() => {
    triggerImpact('light')
    copyText({
      message: t('generic.copiedSeedPhrase'),
      copyText: mnemonic?.join(' ') || '',
    })
  }, [copyText, triggerImpact, mnemonic, t])

  useAsync(async () => {
    if (!currentAccount || !currentAccount.address) return
    const secureAccount = await getSecureAccount(currentAccount.address)
    setMnemonic(secureAccount?.mnemonic)
  }, [currentAccount])

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item, index }: { item: string; index: number }) => {
      return (
        <Box
          borderRadius="round"
          padding="s"
          marginHorizontal="s"
          marginBottom="m"
          flex={1}
          overflow="hidden"
          backgroundColor="surfaceSecondary"
          alignItems="center"
          justifyContent="center"
          flexDirection="row"
        >
          <Text
            fontSize={16}
            color="primaryText"
            maxFontSizeMultiplier={1}
            adjustsFontSizeToFit
          >{`${index + 1}. `}</Text>
          <Text
            fontSize={16}
            color="primaryText"
            maxFontSizeMultiplier={1}
            adjustsFontSizeToFit
          >
            {upperCase(item)}
          </Text>
        </Box>
      )
    },
    [],
  )

  const contentContainerStyle = useMemo(
    () => ({
      marginTop: spacing.m,
      flexGrow: 1,
      padding: spacing.l,
    }),
    [spacing],
  )

  const ListHeaderComponent = useCallback(() => {
    return (
      <Box
        backgroundColor="red500Transparent10"
        borderRadius="l"
        padding="l"
        marginBottom="l"
      >
        <TextTransform
          textAlign="center"
          variant="body1"
          maxFontSizeMultiplier={1}
          i18nKey="settings.revealWords.subtitle"
          values={{ numWords: mnemonic?.length }}
        />
      </Box>
    )
  }, [mnemonic?.length])

  const ListFooterComponent = useCallback(() => {
    return (
      <Box>
        <TouchableOpacityBox
          onPress={handleCopySeedPhrase}
          justifyContent="center"
          alignItems="center"
          flexDirection="row"
          marginTop="m"
          marginBottom="xl"
        >
          <CopyAddress width={16} height={16} color={secondaryText} />
          <Text
            marginStart="s"
            variant="body2"
            color="secondaryText"
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.2}
            textAlign="center"
          >
            {t('generic.copyToClipboard')}
          </Text>
        </TouchableOpacityBox>
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
      </Box>
    )
  }, [handleCopySeedPhrase, secondaryText, t, navigation])

  return (
    <BackScreen
      rootBackgroundColor="black"
      backgroundColor="black"
      flex={1}
      title={t('settings.revealWords.title', { numWords: mnemonic?.length })}
      edges={[]}
      padding="none"
    >
      <FlatList
        numColumns={2}
        columnWrapperStyle={{
          flexDirection: 'row',
        }}
        data={mnemonic || []}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListFooterComponentStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
        renderItem={renderItem}
        contentContainerStyle={contentContainerStyle}
        scrollEnabled
        initialNumToRender={100}
        // ^ Sometimes on initial page load there is a bug with SectionList
        // where it won't render all items right away. This seems to fix it.
      />
      {/* </SafeAreaBox> */}
    </BackScreen>
  )
}

export default memo(RevealWordsScreen)
