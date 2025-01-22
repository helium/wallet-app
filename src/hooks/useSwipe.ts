import { Dimensions, GestureResponderEvent } from 'react-native'
import useHaptic from './useHaptic'

const windowWidth = Dimensions.get('window').width

export function useSwipe(
  onSwipeLeft?: ((event: GestureResponderEvent) => void) | undefined,
  onSwipeRight?: ((event: GestureResponderEvent) => void) | undefined,
  rangeOffset = 4,
) {
  const { triggerImpact } = useHaptic()
  let firstTouch = 0

  // set user touch start position
  function onTouchStart(e: GestureResponderEvent) {
    firstTouch = e.nativeEvent.pageX
  }

  // when touch ends check for swipe directions
  function onTouchEnd(e: GestureResponderEvent) {
    // get touch position and screen size
    const positionX = e.nativeEvent.pageX
    const range = windowWidth / rangeOffset
    // check if position is growing positively and has reached specified range
    const swipeRightRange = positionX - firstTouch
    if (swipeRightRange > range) {
      if (onSwipeRight) {
        triggerImpact('medium')
        onSwipeRight(e)
      }
    }
    // check if position is growing negatively and has reached specified range
    const swipeLeftRange = firstTouch - positionX
    if (swipeLeftRange > range) {
      if (onSwipeLeft) {
        triggerImpact('medium')
        onSwipeLeft(e)
      }
    }
  }

  return { onTouchStart, onTouchEnd }
}
