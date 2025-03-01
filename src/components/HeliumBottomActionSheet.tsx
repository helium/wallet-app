import React, { memo, useCallback, useEffect } from 'react'
import { BoxProps } from '@shopify/restyle'
import Close from '@assets/svgs/close.svg'
import { Modal } from 'react-native'
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { Theme } from '@config/theme/theme'
import { useColors } from '@config/theme/themeHooks'
import useDisappear from '@hooks/useDisappear'
import Text from './Text'
import Box from './Box'
import TouchableOpacityBox from './TouchableOpacityBox'
import BlurBox from './BlurBox'
import { ReAnimatedBox } from './AnimatedBox'

type Props = BoxProps<Theme> & {
  children?: React.ReactNode
  hideHeaderBorder?: boolean
  isVisible: boolean
  onClose: () => void
  sheetHeight?: number
  title?: string
}

const HeliumBottomActionSheet = ({
  children,
  hideHeaderBorder = false,
  isVisible,
  onClose,
  sheetHeight = 260,
  title,
}: Props) => {
  const colors = useColors()
  const offset = useSharedValue(0)

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: offset.value + sheetHeight }],
    }
  })

  const animate = useCallback(
    (val: number) => {
      offset.value = withSpring(val, {
        damping: 80,
        overshootClamping: true,
        restDisplacementThreshold: 0.1,
        restSpeedThreshold: 0.1,
        stiffness: 500,
      })
    },
    [offset],
  )

  const handleClose = useCallback(async () => {
    onClose()
  }, [onClose])

  useDisappear(handleClose)

  useEffect(() => {
    if (isVisible) {
      offset.value = 0
      animate(-sheetHeight)
    }
  }, [animate, isVisible, offset, sheetHeight])

  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={handleClose}
      animationType="fade"
    >
      <BlurBox position="absolute" top={0} bottom={0} left={0} right={0} />
      <Box flex={1}>
        <TouchableOpacityBox flex={1} onPress={handleClose} />
        <ReAnimatedBox
          style={animatedStyles}
          borderTopLeftRadius="2xl"
          borderTopRightRadius="2xl"
          height={sheetHeight}
          backgroundColor="bg.tertiary"
          paddingHorizontal="7"
        >
          <Box
            flexDirection="row"
            borderBottomWidth={hideHeaderBorder ? 0 : 1}
            borderBottomColor="secondaryText"
            marginTop="2"
            marginBottom="4"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text color="secondaryText" variant="textSmRegular">
              {title}
            </Text>
            <TouchableOpacityBox
              onPress={handleClose}
              height={50}
              justifyContent="center"
              paddingHorizontal="4"
              marginEnd="-4"
            >
              <Close color={colors.secondaryText} height={14} width={14} />
            </TouchableOpacityBox>
          </Box>
          {children}
        </ReAnimatedBox>
      </Box>
    </Modal>
  )
}

export default memo(HeliumBottomActionSheet)
