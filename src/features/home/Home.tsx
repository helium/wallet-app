import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useLazyQuery } from '@apollo/client'
import Balance, { CurrencyType } from '@helium/currency'
import SafeAreaBox from '../../components/SafeAreaBox'
import Text from '../../components/Text'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { HomeNavigationProp } from './homeTypes'
import { ACCOUNTS_WALLET_QUERY } from '../../graphql/account'
import {
  AccountsVariables,
  Accounts,
} from '../../graphql/__generated__/Accounts'

const Home = () => {
  const { accounts, signOut } = useAccountStorage()
  const { t } = useTranslation()
  const navigation = useNavigation<HomeNavigationProp>()
  const [getData, { data }] = useLazyQuery<Accounts, AccountsVariables>(
    ACCOUNTS_WALLET_QUERY,
    {
      notifyOnNetworkStatusChange: true,
    },
  )

  useEffect(() => {
    const accountAddresses = Object.keys(accounts || {})
    if (!accountAddresses) return

    getData({ variables: { addresses: accountAddresses } })
  }, [accounts, getData])

  const displayVals = useMemo(() => {
    if (!data?.accounts) return

    const vals = data.accounts.reduce(
      ({ hnt, dc, stakedHnt, hst }, val) => {
        return {
          hnt: new Balance(val?.balance || 0, CurrencyType.networkToken).plus(
            hnt,
          ),
          dc: new Balance(val?.dcBalance || 0, CurrencyType.dataCredit).plus(
            dc,
          ),
          stakedHnt: new Balance(
            val?.stakedBalance || 0,
            CurrencyType.networkToken,
          ).plus(stakedHnt),
          hst: new Balance(val?.secBalance || 0, CurrencyType.security).plus(
            hst,
          ),
        }
      },
      {
        hnt: new Balance(0, CurrencyType.networkToken),
        dc: new Balance(0, CurrencyType.dataCredit),
        stakedHnt: new Balance(0, CurrencyType.networkToken),
        hst: new Balance(0, CurrencyType.security),
      },
    )
    return vals
  }, [data])

  const handleAddAccount = useCallback(() => {
    navigation.navigate('AddAccount', {
      screen: 'Welcome',
      params: {
        multiAccount: true,
      },
    })
  }, [navigation])

  return (
    <SafeAreaBox padding="xl" backgroundColor="primaryBackground" flex={1}>
      <Button title={t('auth.signOut')} onPress={signOut} />
      <Button title="Add Account" onPress={handleAddAccount} />
      <Text variant="body1" marginTop="l">{`HNT: ${displayVals?.hnt.toString(
        2,
      )}`}</Text>
      <Text variant="body1" marginTop="l">{`DC: ${displayVals?.dc.toString(
        2,
      )}`}</Text>
      <Text
        variant="body1"
        marginTop="l"
      >{`StakedHNT: ${displayVals?.stakedHnt.toString(2)}`}</Text>
      <Text variant="body1" marginTop="l">{`HST: ${displayVals?.hst.toString(
        2,
      )}`}</Text>
      <Text variant="body1" marginTop="l">{`Accounts:\n${JSON.stringify(
        Object.keys(accounts || {}),
        null,
        2,
      )}`}</Text>
    </SafeAreaBox>
  )
}

export default memo(Home)
