import { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { Box, ReAnimatedBox } from '.'
import TouchableOpacityBox from './TouchableOpacityBox'

type MenuButtonProps = {
  isOpen: boolean
  onPress: () => void
}

const MenuButton = ({ isOpen, onPress }: MenuButtonProps) => {
  const firstBoxAnimatedStyle = useAnimatedStyle(() => {
    if (isOpen) {
      // Rotate 45 degrees to form the first part of the X
      return {
        transform: [
          { rotate: withTiming('45deg') },
          {
            translateY: withTiming(12),
          },
        ],
        width: withTiming(33.87),
      }
    }
    return {
      transform: [
        { rotate: withTiming('0deg') },
        {
          translateY: withTiming(0),
        },
      ],
      width: withTiming(28.87),
    }
  }, [isOpen])

  const secondBoxAnimatedStyle = useAnimatedStyle(() => {
    if (isOpen) {
      // Set opacity to 0 to hide the second part of the hamburger menu
      return {
        opacity: withTiming(0),
      }
    }

    return {
      opacity: withTiming(1),
    }
  }, [isOpen])

  const thirdBoxAnimatedStyle = useAnimatedStyle(() => {
    if (isOpen) {
      // Rotate -45 degrees to form the third part of the X
      return {
        transform: [
          { rotate: withTiming('-45deg') },
          {
            translateX: withTiming(2),
          },
          {
            translateY: withTiming(-14),
          },
        ],
        width: withTiming(33.87),
      }
    }

    return {
      transform: [
        { rotate: withTiming('0deg') },
        {
          translateX: withTiming(0),
        },
        {
          translateY: withTiming(0),
        },
      ],
      width: withTiming(12.02),
    }
  }, [isOpen])

  return (
    <TouchableOpacityBox onPress={onPress} gap="1.5">
      <ReAnimatedBox
        height={4}
        width={28.87}
        backgroundColor={'primaryText'}
        borderRadius={'full'}
        style={[firstBoxAnimatedStyle]}
      />
      <ReAnimatedBox
        height={4}
        width={20.99}
        backgroundColor={'primaryText'}
        borderRadius={'full'}
        style={[secondBoxAnimatedStyle]}
      />
      <ReAnimatedBox
        height={4}
        width={12.02}
        backgroundColor={'primaryText'}
        borderRadius={'full'}
        style={[thirdBoxAnimatedStyle]}
      />
    </TouchableOpacityBox>
  )
}

export default MenuButton
