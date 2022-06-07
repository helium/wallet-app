import React, { useMemo } from 'react'
import Internet from '@assets/images/internet.svg'
import { useNavigation } from '@react-navigation/native'
import { useColors } from '../../theme/themeHooks'
import { HomeNavigationProp } from '../home/homeTypes'

export type InternetProvider = {
  name: string
  Icon: React.FC
  action: () => void
}

export default () => {
  const colors = useColors()
  const navigation = useNavigation<HomeNavigationProp>()

  return useMemo(
    () =>
      [
        {
          name: 'Internet',
          Icon: () => <Internet color={colors.primaryText} height={65} />,
          action: () => navigation.push('Internet'),
        },
      ] as InternetProvider[],
    [colors.primaryText, navigation],
  )
}
