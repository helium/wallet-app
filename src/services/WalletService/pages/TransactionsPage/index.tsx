import { ReAnimatedBox } from '@components/AnimatedBox'
import ActivityNavigator from '@features/activity/ActivityNavigator'
import React from 'react'
import { FadeIn } from 'react-native-reanimated'

const TransactionsPage = () => {
  return (
    <ReAnimatedBox entering={FadeIn} flex={1}>
      <ActivityNavigator />
    </ReAnimatedBox>
  )
}

export default TransactionsPage
