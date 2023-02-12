import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import {
  NativeSyntheticEvent,
  SectionList,
  TextInput as RNTextInput,
  TextInputSubmitEditingEventData,
} from 'react-native'
import CloseCircle from '@assets/images/CloseCircle.svg'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import FadeInOut from '../../components/FadeInOut'
import SafeAreaBox from '../../components/SafeAreaBox'
import TextInput from '../../components/TextInput'
import Box from '../../components/Box'
import { ReAnimatedBox } from '../../components/AnimatedBox'
import { useColors, useSpacing } from '../../theme/themeHooks'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import Text from '../../components/Text'
import { BrowserNavigationProp } from './browserTypes'
import BrowserListItem from './BrowserListItem'
import useBrowser from '../../hooks/useBrowser'

const BrowserScreen = () => {
  const DEFAULT_URL = 'https://app.realms.today/'
  const edges = useMemo(() => ['top'] as Edge[], [])
  const [inputFocused, setInputFocused] = useState(false)
  const spacing = useSpacing()
  const textInputRef = useRef<RNTextInput | null>(null)
  const { top } = useSafeAreaInsets()
  const colors = useColors()
  const navigation = useNavigation<BrowserNavigationProp>()
  const { favorites, recents, addRecent } = useBrowser()
  const { t } = useTranslation()

  const SectionData = useMemo((): {
    title: string
    data: string[]
  }[] => {
    const sections = [
      {
        title: t('browserScreen.myFavorites'),
        data: favorites,
      },
      {
        title: t('browserScreen.recentlyVisited'),
        data: recents,
      },
    ]

    return sections
  }, [favorites, recents, t])

  const onBrowserInputFocus = useCallback(() => {
    setInputFocused(true)
  }, [])

  const onBrowserInputBlur = useCallback(() => {
    setInputFocused(false)
  }, [])

  // Slide browser header to left on focus
  const headerStyles = useAnimatedStyle(() => {
    if (inputFocused) {
      // Animate margin end
      return {
        marginEnd: withTiming(spacing.xxl, {
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

  const onClearPressed = useCallback(() => {
    textInputRef.current?.clear()
  }, [])

  const onCancelPressed = useCallback(() => {
    textInputRef.current?.blur()
    setInputFocused(false)
  }, [textInputRef])

  const onSubmitEditing = useCallback(
    (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      // TODO: Validate browser text is a valid url

      const browserText = event.nativeEvent.text
      addRecent(browserText)
      navigation.push('BrowserWebViewScreen', {
        uri: browserText,
      })
    },
    [navigation, addRecent],
  )

  const BrowserHeader = useCallback(() => {
    return (
      <Box
        backgroundColor="black900"
        padding="s"
        flexDirection={inputFocused ? 'row' : 'column'}
      >
        <ReAnimatedBox
          backgroundColor="surfaceSecondary"
          borderRadius="l"
          marginHorizontal="s"
          style={headerStyles}
        >
          <TextInput
            ref={textInputRef}
            variant="transparentSmall"
            fontSize={14}
            onTouchEnd={onBrowserInputFocus}
            TrailingIcon={inputFocused ? CloseCircle : undefined}
            onTrailingIconPress={onClearPressed}
            TrailingIconOptions={{
              paddingStart: 's',
            }}
            textInputProps={{
              placeholder: 'Search or type URL',
              autoFocus: false,
              onFocus: onBrowserInputFocus,
              selectTextOnFocus: true,
              selectionColor: colors.malachite,
              onBlur: onBrowserInputBlur,
              onSubmitEditing,
              defaultValue: DEFAULT_URL,
              autoComplete: 'off',
              autoCapitalize: 'none',
              returnKeyType: 'done',
              autoCorrect: false,
              textAlign: inputFocused ? 'left' : 'center',
              keyboardAppearance: 'dark',
            }}
          />
        </ReAnimatedBox>
        {inputFocused && (
          <TouchableOpacityBox
            marginStart="n_xxl"
            justifyContent="center"
            width={spacing.xxxl + spacing.l}
            onPress={onCancelPressed}
          >
            <Text textAlign="center" variant="body1Medium">
              {t('generic.cancel')}
            </Text>
          </TouchableOpacityBox>
        )}
      </Box>
    )
  }, [
    t,
    headerStyles,
    inputFocused,
    onBrowserInputBlur,
    onBrowserInputFocus,
    onClearPressed,
    onCancelPressed,
    textInputRef,
    colors,
    spacing,
    onSubmitEditing,
  ])

  const renderSectionHeader = useCallback(({ section: { title } }) => {
    const firstSection = title === 'My Favorites'
    return (
      <Box
        flexDirection="row"
        alignItems="center"
        paddingTop={firstSection ? 's' : 'xl'}
        paddingBottom="m"
        paddingHorizontal="l"
        backgroundColor="primaryBackground"
        justifyContent="center"
      >
        <Text variant="body3" textAlign="center" color="secondaryText">
          {title}
        </Text>
      </Box>
    )
  }, [])

  const handleBrowserListItemPress = useCallback(
    (url: string) => () => {
      // TODO: Validate url Maybe?
      navigation.push('BrowserWebViewScreen', {
        uri: url,
      })
    },
    [navigation],
  )

  const renderItem = useCallback(
    ({ item, index, section }) => {
      const firstItem = index === 0
      const lastItem = index === section.data.length - 1

      return (
        <FadeInOut>
          <BrowserListItem
            borderTopStartRadius={firstItem ? 'xl' : undefined}
            borderTopEndRadius={firstItem ? 'xl' : undefined}
            borderBottomStartRadius={lastItem ? 'xl' : undefined}
            borderBottomEndRadius={lastItem ? 'xl' : undefined}
            hasDivider={!lastItem || (firstItem && section.data.length !== 1)}
            marginHorizontal="m"
            url={item}
            onPress={handleBrowserListItemPress(item)}
          />
        </FadeInOut>
      )
    },
    [handleBrowserListItemPress],
  )

  const contentContainer = useMemo(
    () => ({
      paddingTop: spacing.m,
    }),
    [spacing.m],
  )

  const keyExtractor = useCallback((item, index) => item + index, [])

  return (
    <Box flex={1}>
      <Box
        backgroundColor="black900"
        height={top}
        position="absolute"
        top={0}
        left={0}
        right={0}
      />
      <SafeAreaBox flex={1} edges={edges}>
        <BrowserHeader />
        <SectionList
          contentContainerStyle={contentContainer}
          sections={SectionData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          onEndReachedThreshold={0.05}
        />
        <Box />
      </SafeAreaBox>
    </Box>
  )
}

export default BrowserScreen
