import React, { useCallback } from 'react'
import ModalForwardButton from '@assets/svgs/modalForwardButton.svg'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import TouchableContainer from '@components/TouchableContainer'

const ForwardButton = ({ onPress }: { onPress: () => void }) => {
  const handlePress = useCallback(() => {
    onPress()
  }, [onPress])

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
        <ModalForwardButton />
      </TouchableContainer>
    </ReAnimatedBox>
  )
}

export default ForwardButton
