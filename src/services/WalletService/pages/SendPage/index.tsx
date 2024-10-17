import React from 'react'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { FadeIn } from 'react-native-reanimated'
import SendPageNavigator from './SentPageNavigator'

const SendPage = () => {
  return (
    <ReAnimatedBox entering={FadeIn} flex={1}>
      <SendPageNavigator />
    </ReAnimatedBox>
  )
}

export default SendPage
