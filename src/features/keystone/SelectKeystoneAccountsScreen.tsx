/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-console */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/react-in-jsx-scope */
import React, { useCallback, useEffect, useState } from 'react'
import { NetTypes as NetType } from '@helium/address'
import Box from '@components/Box'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import ButtonPressable from '@components/ButtonPressable'
import { FlatList, RefreshControl } from 'react-native'
import { useColors } from '@theme/themeHooks'
import CheckBox from '@react-native-community/checkbox'
import TouchableContainer from '@components/TouchableContainer'
import { humanReadable } from '@helium/spl-utils'
import BN from 'bn.js'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import {
  RootNavigationProp,
  RootStackParamList,
} from 'src/navigation/rootTypes'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { ellipsizeAddress } from '@utils/accountUtils'
import base58 from 'bs58'
import { retryWithBackoff } from '@utils/retryWithBackoff'
import { PublicKey } from '@solana/web3.js'
import { useSolana } from '../../solana/SolanaProvider'
import { useKeystoneOnboarding } from './KeystoneOnboardingProvider'

export type KeystoneAccountType = {
  path: string
  publicKey: string
  masterFingerprint: string
  device: string
  balanceSol?: string
}

type SelectKeystoneAccountsScreenRouteProp = RouteProp<
  RootStackParamList,
  'SelectKeystoneAccounts'
>

const SelectKeystoneAccountsScreen = () => {
  const colors = useColors()
  const route = useRoute<SelectKeystoneAccountsScreenRouteProp>()
  const { setKeystoneOnboardingData } = useKeystoneOnboarding()
  const { hasAccounts } = useAccountStorage()
  const { derivationAccounts } = route.params
  const [selected, setSelected] = React.useState<Set<string>>(
    new Set([derivationAccounts[0].path as string]),
  )
  const [loading, setLoading] = useState<boolean>(true)
  const { connection } = useSolana()
  // storage the selected accounts
  const storageSelectedAccounts = () => {
    const selectedAccounts: KeystoneAccountType[] = Array.from(selected).map(
      (path) => {
        const account = derivationAccounts.find(
          (account) => account.path === path,
        )
        return {
          path,
          publicKey: account?.publicKey || '',
          masterFingerprint: account?.masterFingerprint || '',
          device: account?.device || '',
          balanceSol: account?.balanceSol || '0',
        }
      },
    )
    setKeystoneOnboardingData({
      accounts: selectedAccounts,
      netType: NetType.MAINNET,
    })
  }
  // next page
  const navigation = useNavigation<RootNavigationProp>()

  const onNext = useCallback(() => {
    storageSelectedAccounts()
    if (hasAccounts) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      navigation.replace('TabBarNavigator', {
        screen: 'Home',
        params: {
          screen: 'KeystoneAccountAssignScreen',
        },
      })
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      navigation.replace('OnboardingNavigator', {
        screen: 'KeystoneNavigator',
        params: {
          screen: 'KeystoneAccountAssignScreen',
        },
      })
    }
  }, [hasAccounts, navigation, selected])

  const fetchBalance = async (publicKey: string) => {
    if (connection) {
      const balance = await connection.getBalance(
        new PublicKey(base58.encode(Buffer.from(publicKey, 'hex'))),
      )
      console.log('sol balance ', balance)
      return balance.toString()
    }
    return '0'
  }
  useEffect(() => {
    setLoading(true)
    async function fetchBalanceForAccounts() {
      for (const account of derivationAccounts) {
        const balance = await retryWithBackoff(() =>
          fetchBalance(account.publicKey),
        )
        account.balanceSol = balance
      }
    }
    fetchBalanceForAccounts().then(() => {
      setLoading(false)
    })
  }, [derivationAccounts])
  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({
      item,
      index,
    }: {
      item: typeof derivationAccounts[number]
      index: number
    }) => {
      const onSelect = () => {
        if (selected.has(item.path as string)) {
          selected.delete(item.path as string)
          setSelected(selected)
        } else {
          selected.add(item.path as string)
          setSelected(selected)
        }
      }

      return (
        <TouchableContainer
          onPress={onSelect}
          flexDirection="row"
          minHeight={72}
          alignItems="center"
          paddingHorizontal="m"
          paddingVertical="m"
          borderBottomColor="primaryBackground"
          borderBottomWidth={index === derivationAccounts.length - 1 ? 0 : 1}
        >
          <Box flex={1} paddingHorizontal="m">
            <Box flexDirection="column" justifyContent="flex-start">
              <Text
                variant="body1"
                color="primaryText"
                maxFontSizeMultiplier={1.3}
              >
                {item.path}
              </Text>
              <Text
                variant="body2Medium"
                color="secondaryText"
                maxFontSizeMultiplier={1.3}
              >
                {ellipsizeAddress(
                  base58.encode(Buffer.from(item.publicKey, 'hex')),
                )}
              </Text>
              <Text
                variant="body2Medium"
                color="secondaryText"
                maxFontSizeMultiplier={1.3}
              >
                {item.balanceSol
                  ? humanReadable(new BN(item.balanceSol), 9)
                  : '0'}{' '}
                SOL
              </Text>
            </Box>
          </Box>
          <Box justifyContent="center" alignItems="center" marginEnd="xs">
            <CheckBox
              value={selected.has(item.path as string)}
              style={{ height: 18, width: 18 }}
              tintColors={{
                true: colors.primaryText,
                false: colors.transparent10,
              }}
              onCheckColor={colors.secondary}
              onTintColor={colors.primaryText}
              tintColor={colors.transparent10}
              onFillColor={colors.primaryText}
              onAnimationType="fill"
              offAnimationType="fill"
              boxType="square"
              onValueChange={() => {}}
            />
          </Box>
        </TouchableContainer>
      )
    },
    [
      colors.primaryText,
      colors.secondary,
      colors.transparent10,
      derivationAccounts,
      selected,
    ],
  )
  return (
    <SafeAreaBox backgroundColor="secondaryBackground" flex={1}>
      <Box flex={1} backgroundColor="secondaryBackground" height="100%">
        <Text
          variant="h1"
          mt="xl"
          textAlign="center"
          fontSize={44}
          lineHeight={44}
          mb="s"
        >
          Select Keystone Accounts
        </Text>
        <Text textAlign="center" p="s" variant="body1" mb="l">
          A secret phrase can be used to generate multiple wallets by using
          derivation paths. The following derivation paths have been
          automatically detected. Select the wallets you would like to import.
        </Text>
        <FlatList
          refreshControl={
            <RefreshControl
              enabled
              refreshing={loading}
              onRefresh={() => {}}
              title=""
              tintColor={colors.primaryText}
            />
          }
          data={derivationAccounts}
          renderItem={renderItem}
          keyExtractor={(item) => item.path as string}
          refreshing={loading}
          onEndReached={() => {}}
        />

        <ButtonPressable
          marginTop="l"
          borderRadius="round"
          backgroundColor="white"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="surfaceSecondary"
          backgroundColorDisabledOpacity={0.5}
          titleColorDisabled="black500"
          titleColor="black500"
          disabled={selected.size === 0}
          onPress={onNext}
          title="Next"
          marginBottom="l"
          marginHorizontal="l"
        />
      </Box>
    </SafeAreaBox>
  )
}

export default React.memo(SelectKeystoneAccountsScreen)
