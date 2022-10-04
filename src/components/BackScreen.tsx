/* eslint-disable react/jsx-props-no-spreading */
import { useNavigation } from '@react-navigation/native'
import { BoxProps } from '@shopify/restyle'
import React, { memo } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { Spacing, Theme } from '../theme/theme'
import BackButton from './BackButton'
import Box from './Box'
import CloseButton from './CloseButton'
import SafeAreaBox from './SafeAreaBox'
import Text from './Text'

type Props = BoxProps<Theme> & {
  children?: React.ReactNode
  edges?: Edge[]
  onClose?: () => void
  hideBack?: boolean
  headerHorizontalPadding?: Spacing
  onLayout?: (event: LayoutChangeEvent) => void
  onHeaderLayout?: (event: LayoutChangeEvent) => void
  title?: string
}

const BackScreen = ({
  backgroundColor,
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
  ...rest
}: Props) => {
  const navigation = useNavigation()
  return (
    <SafeAreaBox
      edges={edges || undefined}
      backgroundColor={backgroundColor || 'primaryBackground'}
      flex={1}
      onLayout={onLayout}
    >
      <Box
        flexDirection="row"
        paddingHorizontal={headerHorizontalPadding}
        onLayout={onHeaderLayout}
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
            marginEnd="n_lx"
            onPress={onClose}
          />
        )}
      </Box>
      <Box padding={padding || 'lx'} flex={flex || 1} {...rest}>
        {children}
      </Box>
    </SafeAreaBox>
  )
}

export default memo(BackScreen)
