import { useCallback, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'

export default () => {
  const [width, setWidth] = useState(0)

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width)
  }, [])

  return [width, onLayout] as [number, (e: LayoutChangeEvent) => void]
}
