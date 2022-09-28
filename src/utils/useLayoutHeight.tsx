import { useCallback, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'

export default () => {
  const [height, setHeight] = useState(0)

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setHeight(e.nativeEvent.layout.height)
  }, [])

  return [height, onLayout] as [number, (e: LayoutChangeEvent) => void]
}
