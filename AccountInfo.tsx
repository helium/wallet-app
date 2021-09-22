import React, {memo, useState} from 'react';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {gql, useLazyQuery, useQuery} from '@apollo/client';
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
      }
    }
  }
`;

const AccountInfo = () => {
  const [address, setAddress] = useState('');
  const [getData, {loading, data}] = useLazyQuery(DATA_QUERY);
  console.log({loading, data, address});

  if (loading) {
    return <ActivityIndicator color="black" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Input
          title="Enter Account Address"
          style={styles.inputContainer}
          inputProps={{
            editable: !loading,
            onChangeText: setAddress,
            value: address,
            placeholder: 'Address',
            style: styles.input,
            multiline: true,
          }}
        />
        <Button
          title="Get Account Data"
          onPress={() => getData({variables: {address, cursor: ''}})}
        />
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
