/* eslint-disable react/jsx-props-no-spreading */
import { useNavigation } from '@react-navigation/native'
import { BoxProps } from '@shopify/restyle'
import React, { memo, useMemo } from 'react'
import { LayoutChangeEvent, Platform } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { SvgProps } from 'react-native-svg'
import { Color, Spacing, Theme } from '@theme/theme'
import { useHitSlop } from '@theme/themeHooks'
import BackButton from './BackButton'
import Box from './Box'
import CloseButton from './CloseButton'
import ImageBox from './ImageBox'
import SafeAreaBox from './SafeAreaBox'
import Text from './Text'
import { width, height } from '../utils/layout'
import TouchableOpacityBox from './TouchableOpacityBox'
import BlurBox from './BlurBox'

type Props = BoxProps<Theme> & {
  children?: React.ReactNode
  edges?: Edge[]
  onClose?: () => void
  hideBack?: boolean
  headerHorizontalPadding?: Spacing
  onLayout?: (event: LayoutChangeEvent) => void
  onHeaderLayout?: (event: LayoutChangeEvent) => void
  title?: string
  headerBackgroundColor?: Color
  backgroundImageUri?: string
  TrailingIcon?: React.FC<SvgProps>
  onTrailingIconPress?: () => void
  headerTopMargin?: Spacing
  rootBackgroundColor?: Color
}

const BackScreen = ({
  children,
  flex,
  padding,
  edges,
  onClose,
  hideBack,
  headerHorizontalPadding = 'lx',
  onLayout,
  onHeaderLayout,
  title,
  headerBackgroundColor,
  backgroundImageUri,
  TrailingIcon,
  onTrailingIconPress,
  headerTopMargin,
  rootBackgroundColor,
  ...rest
}: Props) => {
  const navigation = useNavigation()
  const hitSlop = useHitSlop('l')
  const isAndroid = useMemo(() => Platform.OS === 'android', [])

  return (
    <Box flex={1} backgroundColor={rootBackgroundColor}>
      <SafeAreaBox edges={edges || undefined} onLayout={onLayout} flex={1}>
        <Box
          flexDirection="row"
          paddingHorizontal={headerHorizontalPadding}
          onLayout={onHeaderLayout}
          backgroundColor={headerBackgroundColor}
          marginTop={headerTopMargin}
        >
          <Box
            position="absolute"
            left={0}
            right={0}
            bottom={0}
            top={0}
            alignItems="center"
            justifyContent="center"
          >
            <Text variant="subtitle1">{title}</Text>
          </Box>
          {!hideBack && (
            <BackButton
              marginHorizontal="n_ms"
              paddingHorizontal="none"
              onPress={navigation.goBack}
            />
          )}
          <Box flex={1} />
          {onClose && (
            <CloseButton
              paddingHorizontal="lx"
              hitSlop={hitSlop}
              marginEnd="n_lx"
              onPress={onClose}
            />
          )}

          {TrailingIcon && (
            <TouchableOpacityBox
              hitSlop={hitSlop}
              marginEnd="n_lx"
              paddingHorizontal="lx"
              onPress={onTrailingIconPress}
              justifyContent="center"
            >
              <TrailingIcon />
            </TouchableOpacityBox>
          )}
        </Box>
        <Box padding={padding || 'lx'} flex={flex || 1} {...rest}>
          {children}
        </Box>
      </SafeAreaBox>

      {/**
       * If backgroundImageUri is provided, we render a blurred version of the image
       *
       * On android the app will crash when using a BlurView inside of a tab bar.
       * There is a patch in place to prevent this.
       * Details can be found here https://github.com/Kureev/react-native-blur/issues/461
       *
       */}
      {backgroundImageUri && (
        <>
          <ImageBox
            zIndex={-2}
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            height={height}
            width={width}
            source={{ uri: backgroundImageUri, cache: 'force-cache' }}
            resizeMode="cover"
            opacity={0.7}
          />
          <BlurBox
            zIndex={-1}
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            blurAmount={isAndroid ? 15 : 5}
            blurType={isAndroid ? 'dark' : 'thinMaterialDark'}
          />
        </>
      )}
    </Box>
  )
}

export default memo(BackScreen)
