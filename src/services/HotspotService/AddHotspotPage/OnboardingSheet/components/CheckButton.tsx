import React, { useCallback } from 'react'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import TouchableContainer from '@components/TouchableContainer'
import ModalCheckButton from '@assets/images/modalCheckButton.svg'
import ModalOnDarkCheckButton from '@assets/images/modalCheckOnDarkButton.svg'
import TouchableOpacityBox from '@components/TouchableOpacityBox'

export type CheckButtonProps = {
  onPress: () => void
  isDark?: boolean
}

const CheckButton = ({ onPress, isDark }: CheckButtonProps) => {
  const handlePress = useCallback(() => {
    onPress()
  }, [onPress])

  if (isDark) {
    return (
      <ReAnimatedBox
        entering={FadeIn}
        exiting={FadeOut}
        flexDirection="row"
        justifyContent="flex-end"
        paddingBottom="4xl"
        paddingHorizontal="2xl"
        position="absolute"
        backgroundColor="transparent"
        bottom={0}
        right={0}
      >
        <TouchableOpacityBox
          onPress={handlePress}
          backgroundColor="transparent"
          borderRadius="full"
        >
          <ModalOnDarkCheckButton />
        </TouchableOpacityBox>
      </ReAnimatedBox>
    )
  }

  return (
    <ReAnimatedBox
      entering={FadeIn}
      exiting={FadeOut}
      flexDirection="row"
      justifyContent="flex-end"
      paddingBottom="4xl"
      paddingHorizontal="2xl"
      position="absolute"
      bottom={0}
      right={0}
    >
      <TouchableContainer
        onPress={handlePress}
        pressableStyles={{ flex: undefined }}
        backgroundColor="primaryText"
        backgroundColorPressed="primaryText"
        borderRadius="full"
      >
        <ModalCheckButton />
      </TouchableContainer>
    </ReAnimatedBox>
  )
}

export default CheckButton
