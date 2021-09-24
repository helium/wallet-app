import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Button, FlatList, Keyboard } from 'react-native'
import { useLazyQuery } from '@apollo/client'
import Balance, { CurrencyType } from '@helium/currency'
import { DATA_QUERY } from './graphql/account'
import TextInput from './components/TextInput'
import Text from './components/Text'
import {
  Account,
  Account_accountActivity_data,
} from './graphql/__generated__/Account'
import SafeAreaBox from './components/SafeAreaBox'
import TouchableOpacityBox from './components/TouchableOpacityBox'

const AccountInfo = () => {
  const [address, setAddress] = useState('')
  const [cursor, setCursor] = useState('')
  const [getData, { loading, data, fetchMore, error }] = useLazyQuery<Account>(
    DATA_QUERY,
    {
      notifyOnNetworkStatusChange: true,
    },
  )

  useEffect(() => {
    if (!data?.accountActivity) {
      return
    }
    const {
      accountActivity: { cursor: nextCursor },
    } = data

    setCursor(nextCursor || '')
  }, [cursor, data])

  const handleTextChange = useCallback((text) => {
    setAddress(text)
    setCursor('')
  }, [])

  const handleDataRequest = useCallback(() => {
    Keyboard.dismiss()
    getData({ variables: { address, cursor } })
  }, [address, cursor, getData])

  const handleFetchMore = useCallback(() => {
    fetchMore?.({ variables: { address, cursor } })
  }, [address, cursor, fetchMore])

  const handlePress = useCallback(() => {}, [])

  const renderItem = useCallback(
    (listItem: { index: number; item: Account_accountActivity_data }) => {
      return (
        <TouchableOpacityBox
          onPress={handlePress}
          height={60}
          padding="m"
          backgroundColor="primaryBackground"
          justifyContent="center"
          borderBottomColor="primary"
          borderBottomWidth={1}
        >
          <Text variant="body1">{listItem.item?.type}</Text>
        </TouchableOpacityBox>
      )
    },
    [handlePress],
  )

  const listData = useMemo(
    (): Account_accountActivity_data[] => data?.accountActivity?.data || [],
    [data],
  )

  const keyExtractor = useCallback((item) => item.hash, [])

  const balance = useMemo(() => {
    if (!data?.account?.balance) return ''

    return new Balance(
      data.account.balance,
      CurrencyType.networkToken,
    ).toString(2)
  }, [data])

  return (
    <SafeAreaBox padding="l" backgroundColor="primaryBackground" flex={1}>
      <TextInput
        onChangeText={handleTextChange}
        value={address}
        marginVertical="l"
        placeholder="Enter Account Address"
        variant="regular"
        padding="m"
      />
      <Button
        title="Get Account Data"
        onPress={handleDataRequest}
        disabled={!!data}
      />
      <Button title="Fetch More Activity" onPress={handleFetchMore} />
      {loading && <ActivityIndicator color="black" />}
      <Text
        variant="subtitle2"
        marginVertical="l"
      >{`Account Balance: ${balance}`}</Text>
      <Text variant="subtitle1" color="error">
        {error?.message}
      </Text>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    </SafeAreaBox>
  )
}

export default memo(AccountInfo)
