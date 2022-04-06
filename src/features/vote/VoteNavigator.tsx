import React, { memo, useMemo } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useAppStorage } from '../../storage/AppStorageProvider'
import VoteTutorial from './VoteTutorial'
import VoteList from './VoteList'
import VoteShow from './VoteShow'
import VoteBurn from './VoteBurn'

const VoteStack = createStackNavigator()

const VoteNavigator = () => {
  const { voteTutorialShown } = useAppStorage()
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
    }),
    [],
  )
  return (
    <VoteStack.Navigator screenOptions={screenOptions}>
      {!voteTutorialShown && (
        <VoteStack.Screen name="VoteTutorial" component={VoteTutorial} />
      )}
      <VoteStack.Screen name="VoteList" component={VoteList} />
      <VoteStack.Screen name="VoteShow" component={VoteShow} />
      <VoteStack.Screen name="VoteBurn" component={VoteBurn} />
    </VoteStack.Navigator>
  )
}

export default memo(VoteNavigator)
