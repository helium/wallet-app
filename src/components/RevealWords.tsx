import React, { memo, useCallback, useMemo } from 'react'
import { upperCase } from 'lodash'
import { useTranslation } from 'react-i18next'
import Text from '@components/Text'
import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import { FlatList } from 'react-native'
import { useColors, useSpacing } from '@theme/themeHooks'
import CopyAddress from '@assets/images/copyAddress.svg'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import useCopyText from '@hooks/useCopyText'
import useHaptic from '@hooks/useHaptic'
import { FadeIn } from 'react-native-reanimated'

type Props = {
  mnemonic: string[]
  onDone: () => void
  ListHeaderComponent?: React.ReactElement
}
const RevealWords = ({ mnemonic, onDone, ListHeaderComponent }: Props) => {
  const { t } = useTranslation()
  const spacing = useSpacing()
  const { secondaryText } = useColors()
  const copyText = useCopyText()
  const { triggerImpact } = useHaptic()

  const handleCopySeedPhrase = useCallback(() => {
    triggerImpact('light')
    copyText({
      message: t('generic.copiedSeedPhrase'),
      copyText: mnemonic.join(' ') || '',
    })
  }, [copyText, triggerImpact, mnemonic, t])

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
      flexGrow: 1,
      paddingHorizontal: spacing.l,
    }),
    [spacing],
  )

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
          onPress={onDone}
        />
      </Box>
    )
  }, [handleCopySeedPhrase, secondaryText, t, onDone])

  return (
    <ReAnimatedBox flex={1} entering={FadeIn.delay(300)}>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <FlatList
        numColumns={2}
        initialNumToRender={mnemonic.length}
        columnWrapperStyle={{
          flexDirection: 'row',
        }}
        data={mnemonic}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListFooterComponentStyle={{
          flexGrow: 1,
          justifyContent: 'flex-end',
        }}
        renderItem={renderItem}
        contentContainerStyle={contentContainerStyle}
        scrollEnabled
        removeClippedSubviews={false}
      />
    </ReAnimatedBox>
  )
}

export default memo(RevealWords)
