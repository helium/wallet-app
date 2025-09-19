import { useNavigation } from '@react-navigation/native'
import React, { memo } from 'react'
import CreateImportAccountScreen from '../../onboarding/CreateImportAccountScreen'
import { AddNewAccountNavigationProp } from './addNewAccountTypes'

const AddNewAccountScreen = () => {
  const navigation = useNavigation<AddNewAccountNavigationProp>()

  return <CreateImportAccountScreen navigation={navigation} />
}

export default memo(AddNewAccountScreen)
