import { useNavigation } from '@react-navigation/native'
import React, { useCallback } from 'react'
import SafeAreaBox from '../../../components/SafeAreaBox'
import { HomeNavigationProp } from '../../home/homeTypes'
import AccountCreateStart from '../create/AccountCreateStart'

const MultiAccountImportStartScreen = () => {
  const navigation = useNavigation<HomeNavigationProp>()
  const handleCreate = useCallback(() => {
    navigation.navigate('CreateAccount')
  }, [navigation])

  return (
    <SafeAreaBox flex={1} backgroundColor="primaryBackground">
      <AccountCreateStart onCreate={handleCreate} />
    </SafeAreaBox>
  )
}

export default MultiAccountImportStartScreen
