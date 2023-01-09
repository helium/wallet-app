/* eslint-disable react/jsx-props-no-spreading */
import { useNavigation } from '@react-navigation/native'
import { BoxProps } from '@shopify/restyle'
import React, { memo, useMemo } from 'react'
import { LayoutChangeEvent, Platform } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { SvgProps } from 'react-native-svg'
import Animated from 'react-native-reanimated'
import { Color, Spacing, Theme } from '../theme/theme'
import { useHitSlop } from '../theme/themeHooks'
import BackButton from './BackButton'
import Box from './Box'
import CloseButton from './CloseButton'
import ImageBox from './ImageBox'
import SafeAreaBox from './SafeAreaBox'
import Text from './Text'
import { width, height } from '../utils/layout'
import TouchableOpacityBox from './TouchableOpacityBox'
import BlurBox from './BlurBox'
import { DelayedFadeIn } from './FadeInOut'

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
  ...rest
}: Props) => {
  const navigation = useNavigation()
  const hitSlop = useHitSlop('l')
  const isAndroid = useMemo(() => Platform.OS === 'android', [])

  return (
    <Box flex={1}>
      <SafeAreaBox edges={edges || undefined} onLayout={onLayout} flex={1}>
        <Box
          marginTop={headerTopMargin}
          flexDirection="row"
          paddingHorizontal={headerHorizontalPadding}
          onLayout={onHeaderLayout}
          backgroundColor={headerBackgroundColor}
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
            <BackButton marginHorizontal="n_lx" onPress={navigation.goBack} />
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
       */}

      {backgroundImageUri && (
        <Animated.View
          entering={DelayedFadeIn}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -2,
          }}
        >
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
            opacity={0.3}
          />
          <BlurBox
            zIndex={-1}
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            blurAmount={10}
            blurType={isAndroid ? 'dark' : 'thinMaterialDark'}
          />
        </Animated.View>
      )}
    </Box>
  )
}

export default memo(BackScreen)
