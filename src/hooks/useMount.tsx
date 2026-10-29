import { EffectCallback, useEffect, useEffectEvent } from 'react'

export default (effect: EffectCallback) => {
  const onMount = useEffectEvent(effect)
  useEffect(() => onMount(), [])
}
