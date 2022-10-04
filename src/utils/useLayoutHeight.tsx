import { useCallback, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'

export default (initialValue?: number) => {
  const [height, setHeight] = useState(initialValue || 0)

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setHeight(e.nativeEvent.layout.height)
  }, [])

  return [height, onLayout] as [number, (e: LayoutChangeEvent) => void]
}
