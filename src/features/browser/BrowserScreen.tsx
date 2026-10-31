import React, { useRef, useState } from 'react'
import {
  Edge,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import {
  NativeSyntheticEvent,
  SectionList,
  TextInput as RNTextInput,
  TextInputSubmitEditingEventData,
  View,
} from 'react-native'
import { CircleX } from 'lucide-react-native'
import { withUniwind } from 'uniwind'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import useBrowser from '@hooks/useBrowser'
import { prependHttp } from '@utils/url'
import { BrowserNavigationProp } from './browserTypes'
import BrowserListItem from './BrowserListItem'
import { useSolana } from '../../solana/SolanaProvider'
import { getRecommendedDapps } from '../../utils/walletApiV2'

const SafeArea = withUniwind(SafeAreaView)
const ClearIcon = withUniwind(CircleX)

const EDGES: Edge[] = ['top']

// The header slides left by this much on focus to make room for Cancel.
const FOCUSED_MARGIN_END = 48

const BrowserScreen = () => {
  const DEFAULT_URL = ''
  const { cluster } = useSolana()
  const [inputFocused, setInputFocused] = useState(false)
  const textInputRef = useRef<RNTextInput | null>(null)
  const { top } = useSafeAreaInsets()
  const navigation = useNavigation<BrowserNavigationProp>()
  const { favorites, recents, addRecent } = useBrowser()
  const { t } = useTranslation()

  const { data: recommendedDappsData } = useQuery({
    queryKey: ['recommendedDapps'],
    queryFn: getRecommendedDapps,
  })

  const SectionData: {
    title: string
    data: string[]
  }[] = [
    {
      title: t('browserScreen.topPicks'),
      data: recommendedDappsData ? recommendedDappsData[cluster] : [],
    },
    {
      title: t('browserScreen.myFavorites'),
      data: [...favorites].reverse(),
    },
    {
      title: t('browserScreen.recentlyVisited'),
      data: [...recents].reverse(),
    },
  ]

  const onBrowserInputFocus = () => {
    setInputFocused(true)
  }

  const onBrowserInputBlur = () => {
    setInputFocused(false)
  }

  // Slide browser header to left on focus
  const headerStyles = useAnimatedStyle(() => {
    if (inputFocused) {
      // Animate margin end
      return {
        marginEnd: withTiming(FOCUSED_MARGIN_END, {
          duration: 100,
        }),
      }
    }

    return {
      marginEnd: withTiming(0, {
        duration: 100,
      }),
    }
  }, [inputFocused])

  const onClearPressed = () => {
    textInputRef.current?.clear()
  }

  const onCancelPressed = () => {
    textInputRef.current?.blur()
    setInputFocused(false)
  }

  const onSubmitEditing = (
    event: NativeSyntheticEvent<TextInputSubmitEditingEventData>,
  ) => {
    const browserText = prependHttp(event.nativeEvent.text)
    addRecent(browserText)
    navigation.push('BrowserWebViewScreen', {
      uri: browserText,
    })
  }

  const browserHeader = (
    <View
      className={twMerge(
        'bg-primary p-2',
        inputFocused ? 'flex-row' : 'flex-col',
      )}
    >
      <Animated.View
        className={twMerge(
          'mx-2 flex-row items-center rounded-[12px] bg-secondary',
          inputFocused && 'flex-1',
        )}
        style={headerStyles}
        onTouchEnd={onBrowserInputFocus}
      >
        <Input
          ref={textInputRef}
          className="h-10 w-auto flex-1 border-0 px-4 text-sm shadow-none"
          placeholder="Search or type URL"
          autoFocus={false}
          onFocus={onBrowserInputFocus}
          selectTextOnFocus
          selectionColorClassName="accent-muted-foreground"
          onBlur={onBrowserInputBlur}
          onSubmitEditing={onSubmitEditing}
          defaultValue={DEFAULT_URL}
          autoComplete="off"
          autoCapitalize="none"
          returnKeyType="done"
          autoCorrect={false}
          textAlign={inputFocused ? 'left' : 'center'}
          keyboardAppearance="dark"
        />
        {inputFocused && (
          <PressableScale
            feedback="opacity"
            className="ps-2 pe-4"
            onPress={onClearPressed}
          >
            <ClearIcon size={14} colorClassName="accent-muted-foreground" />
          </PressableScale>
        )}
      </Animated.View>
      {inputFocused && (
        <PressableScale
          feedback="opacity"
          className="-ms-12 w-[84px] justify-center"
          onPress={onCancelPressed}
        >
          <Text
            size="base"
            className="text-center font-medium text-primary-foreground"
          >
            {t('generic.cancel')}
          </Text>
        </PressableScale>
      )}
    </View>
  )

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: { title: string }
  }) => {
    const firstSection = title === 'My Favorites'
    return (
      <View
        className={twMerge(
          'flex-row items-center justify-center bg-background px-6 pb-4',
          firstSection ? 'pt-2' : 'pt-8',
        )}
      >
        <Text size="xs" className="text-center text-muted-foreground">
          {title}
        </Text>
      </View>
    )
  }

  const handleBrowserListItemPress = (url: string) => () => {
    navigation.push('BrowserWebViewScreen', {
      uri: prependHttp(url),
    })
  }

  const renderItem = ({
    item,
    index,
    section,
  }: {
    item: string
    index: number
    section: { data: readonly string[] }
  }) => {
    const firstItem = index === 0
    const lastItem = index === section.data?.length - 1

    return (
      <Animated.View entering={FADE_IN} exiting={FADE_OUT}>
        <BrowserListItem
          className={twMerge(
            'mx-4',
            firstItem && 'rounded-t-[20px]',
            lastItem && 'rounded-b-[20px]',
          )}
          hasDivider={!lastItem || (firstItem && section.data?.length !== 1)}
          url={item}
          onPress={handleBrowserListItemPress(item)}
        />
      </Animated.View>
    )
  }

  const renderSectionFooter = ({
    section: { data, title },
  }: {
    section: { data: readonly string[]; title: string }
  }) => {
    if (data?.length !== 0) {
      return null
    }

    return (
      <View className="mx-4 rounded-[20px] bg-secondary p-4">
        <Text className="text-center font-medium">
          {title === t('browserScreen.myFavorites')
            ? t('browserScreen.myFavoritesEmpty')
            : t('browserScreen.recentlyVisitedEmpty')}
        </Text>
      </View>
    )
  }

  const keyExtractor = (item: string, index: number) => item + index

  return (
    <View className="flex-1">
      <View
        className="absolute inset-x-0 top-0 bg-primary"
        style={{ height: top }}
      />
      <SafeArea className="flex-1" edges={EDGES}>
        {browserHeader}
        <SectionList
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="pt-4"
          sections={SectionData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          onEndReachedThreshold={0.05}
          renderSectionFooter={renderSectionFooter}
        />
        <View />
      </SafeArea>
    </View>
  )
}

export default BrowserScreen
