import { useRef, useEffect } from 'react'

export default <T>(value: T) => {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => {
    ref.current = value
  })
  return ref.current as T
}
