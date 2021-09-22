import React, {memo, useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import {gql, useLazyQuery} from '@apollo/client';
import Input from './Input';

const DATA_QUERY = gql`
  query data($address: String!, $cursor: String) {
    account(address: $address) {
      address
      balance
      block
      dcBalance
      dcNonce
      nonce
      secBalance
      secNonce
      speculativeNonce
      speculativeSecNonce
      stakedBalance
    }
    accountActivity(address: $address, cursor: $cursor) {
      cursor
      data {
        time
        type
        hash
      }
    }
  }
`;

const AccountInfo = () => {
  const [address, setAddress] = useState('');
  const [cursor, setCursor] = useState('');
  const [getData, {loading, data, fetchMore, error}] = useLazyQuery(
    DATA_QUERY,
    {
      notifyOnNetworkStatusChange: true,
    },
  );
  console.log({loading, data, address, cursor, error});

  useEffect(() => {
    if (!data) {
      return;
    }
    const {
      accountActivity: {cursor: nextCursor, data: innerData},
    } = data;

    console.log({dataLength: innerData.length});
    setCursor(nextCursor);
  }, [cursor, data]);

  const handleTextChange = useCallback(text => {
    setAddress(text);
    setCursor('');
  }, []);

  const handleDataRequest = useCallback(() => {
    console.log('handleDataRequest');
    getData({variables: {address, cursor}});
  }, [address, cursor, getData]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
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
        <Button
          title="Fetch More Activity"
          onPress={() => {
            console.log({fetchMore: !!fetchMore});
            fetchMore?.({variables: {address, cursor}});
          }}
        />
        {loading && <ActivityIndicator color="black" />}
        <Text>{JSON.stringify(data, null, 2)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 24,
  },
  inputContainer: {marginVertical: 24},
  input: {},
});

export default memo(AccountInfo);
