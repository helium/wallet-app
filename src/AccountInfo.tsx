import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Button,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native'
import { useLazyQuery } from '@apollo/client'
import Input from './Input'
import { DATA_QUERY } from './graphql/account'
import {
  Account,
  Account_accountActivity_data,
} from './graphql/__generated__/Account'

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
    getData({ variables: { address, cursor } })
  }, [address, cursor, getData])

  const handleFetchMore = useCallback(() => {
    fetchMore?.({ variables: { address, cursor } })
  }, [address, cursor, fetchMore])

  const handlePress = useCallback(() => {}, [])

  const renderItem = useCallback(
    (listItem: { index: number; item: Account_accountActivity_data }) => {
      return (
        <TouchableOpacity onPress={handlePress} style={styles.row}>
          <Text>{listItem.item?.type}</Text>
        </TouchableOpacity>
      )
    },
    [handlePress],
  )

  const listData = useMemo(
    (): Account_accountActivity_data[] => data?.accountActivity?.data || [],
    [data],
  )

  const keyExtractor = useCallback((item) => item.hash, [])

  return (
    <SafeAreaView style={styles.container}>
      <Input
        title="Enter Account Address"
        style={styles.inputContainer}
        inputProps={{
          editable: !loading,
          onChangeText: handleTextChange,
          value: address,
          placeholder: 'Address',
          style: styles.input,
          multiline: true,
        }}
      />
      <Button title="Get Account Data" onPress={handleDataRequest} />
      <Button title="Fetch More Activity" onPress={handleFetchMore} />
      {loading && <ActivityIndicator color="black" />}
      <Text style={styles.error}>{error?.message}</Text>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 24,
  },
  inputContainer: { marginVertical: 24 },
  input: {},
  error: { color: 'red' },
  row: {
    height: 60,
    padding: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    borderBottomColor: 'lightgray',
    borderBottomWidth: 1,
  },
})

export default memo(AccountInfo)
