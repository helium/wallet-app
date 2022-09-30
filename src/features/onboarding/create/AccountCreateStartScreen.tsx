import { useNavigation } from '@react-navigation/native'
import React, { useCallback } from 'react'
import AccountCreateStart from './AccountCreateStart'
import { CreateAccountNavigationProp } from './createAccountNavTypes'

const AccountCreateStartScreen = () => {
  const navigation = useNavigation<CreateAccountNavigationProp>()
  const handleCreate = useCallback(() => {
    navigation.navigate('AccountCreatePassphraseScreen')
  }, [navigation])

  return <AccountCreateStart onCreate={handleCreate} />
}

export default AccountCreateStartScreen
