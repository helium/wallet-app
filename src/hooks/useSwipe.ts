import { Dimensions, GestureResponderEvent } from 'react-native'

const windowWidth = Dimensions.get('window').width

export function useSwipe(
  onSwipeLeft?: ((event: GestureResponderEvent) => void) | undefined,
  onSwipeRight?: ((event: GestureResponderEvent) => void) | undefined,
  rangeOffset = 4,
) {
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
    if (positionX - firstTouch > range) {
      if (onSwipeRight) onSwipeRight(e)
    }
    // check if position is growing negatively and has reached specified range
    else if (firstTouch - positionX > range) {
      if (onSwipeLeft) onSwipeLeft(e)
    }
  }

  return { onTouchStart, onTouchEnd }
}
