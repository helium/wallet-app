import { useNavigation } from '@react-navigation/native'
import React, { useCallback } from 'react'
import SafeAreaBox from '../../../components/SafeAreaBox'
import AccountCreateStart from './AccountCreateStart'
import { CreateAccountNavigationProp } from './createAccountNavTypes'

const AccountCreateStartScreen = () => {
  const navigation = useNavigation<CreateAccountNavigationProp>()
  const handleCreate = useCallback(() => {
    navigation.navigate('AccountCreatePassphraseScreen')
  }, [navigation])

  return (
    <SafeAreaBox flex={1} backgroundColor="primaryBackground">
      <AccountCreateStart onCreate={handleCreate} />
    </SafeAreaBox>
  )
}

export default AccountCreateStartScreen
