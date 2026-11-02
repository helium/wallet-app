import useCopyText from '@hooks/useCopyText'
import useSecureWindow from '@hooks/useSecureWindow'
import { DUR } from '@theme/motion'
import { upperCase } from 'lodash'
import { Copy } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, View } from 'react-native'
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated'
import { withUniwind } from 'uniwind'
import { Button } from './Button'
import { PressableScale } from './PressableScale'
import { Text } from './Text'

const CopyIcon = withUniwind(Copy)

const DELAYED_FADE_IN = FadeIn.duration(DUR.enter)
  .delay(300)
  .reduceMotion(ReduceMotion.Never)

// A mnemonic can repeat a word, so a row is keyed by its place
const keyExtractor = (_word: string, index: number) => String(index)

export type RevealWordsProps = {
  mnemonic: string[]
  onDone: () => void
  ListHeaderComponent?: React.ReactElement
}

// The seed words in two numbered columns, a copy link and a done button.
// Hides the app from capture on Android while it shows.
export const RevealWords = ({
  mnemonic,
  onDone,
  ListHeaderComponent,
}: RevealWordsProps) => {
  const { t } = useTranslation()
  const copyText = useCopyText({ haptic: false })
  useSecureWindow()

  const handleCopySeedPhrase = () => {
    copyText({
      message: t('generic.seedPhrase'),
      copyText: mnemonic.join(' ') || '',
    })
  }

  const renderItem = ({ item, index }: { item: string; index: number }) => (
    <View className="mx-2 mb-4 flex-1 flex-row items-center justify-center overflow-hidden rounded-full bg-secondary p-2">
      <Text
        size="base"
        maxFontSizeMultiplier={1}
        adjustsFontSizeToFit
      >{`${index + 1}. `}</Text>
      <Text
        testID={`RevealWords.Word.${index}`}
        size="base"
        maxFontSizeMultiplier={1}
        adjustsFontSizeToFit
      >
        {upperCase(item)}
      </Text>
    </View>
  )

  const footer = (
    <View>
      <PressableScale
        feedback="opacity"
        onPress={handleCopySeedPhrase}
        className="mb-8 mt-4 flex-row items-center justify-center"
      >
        <CopyIcon size={16} colorClassName="accent-muted-foreground" />
        <Text
          className="ms-2 text-center text-muted-foreground"
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.2}
        >
          {t('generic.copyToClipboard')}
        </Text>
      </PressableScale>
      <View className="flex-1" />
      <Button
        testID="RevealWords.Next"
        variant="secondary"
        size="lg"
        className="mb-4 w-full"
        onPress={onDone}
      >
        {t('settings.revealWords.next')}
      </Button>
    </View>
  )

  return (
    <Animated.View className="flex-1" entering={DELAYED_FADE_IN}>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        numColumns={2}
        initialNumToRender={mnemonic.length}
        columnWrapperClassName="flex-row"
        data={mnemonic}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={footer}
        ListFooterComponentClassName="grow justify-end"
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerClassName="grow px-6"
        scrollEnabled
        removeClippedSubviews={false}
      />
    </Animated.View>
  )
}
