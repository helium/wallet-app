import React, { useEffect, useState } from 'react'
import { Button } from '@ui/Button'
import { Checkbox } from '@ui/Checkbox'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { FlatList, RefreshControl, View } from 'react-native'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { withUniwind } from 'uniwind'
import { humanReadable } from '@helium/spl-utils'
import BN from 'bn.js'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { RootNavigationProp } from 'src/navigation/rootTypes'
import {
  MAX_ACCOUNTS,
  useAccountStorage,
} from '@storage/AccountStorageProvider'
import { ellipsizeAddress, solAddressToHelium } from '@utils/accountUtils'
import base58 from 'bs58'
import { retryWithBackoff } from '@utils/retryWithBackoff'
import { PublicKey } from '@solana/web3.js'
import { useTranslation } from 'react-i18next'
import { useSolana } from '../../solana/SolanaProvider'
import { useKeystoneOnboarding } from './KeystoneOnboardingProvider'
import { KeystoneStackParamList } from './keystoneNavigatorTypes'

export type KeystoneAccountType = {
  path: string
  publicKey: string
  masterFingerprint: string
  device: string
  balanceSol?: string
}

type SelectKeystoneAccountsScreenRouteProp = RouteProp<
  KeystoneStackParamList,
  'SelectKeystoneAccounts'
>

const SafeArea = withUniwind(TabSafeAreaView)

const SelectKeystoneAccountsScreen = () => {
  const route = useRoute<SelectKeystoneAccountsScreenRouteProp>()
  const { setKeystoneOnboardingData } = useKeystoneOnboarding()
  const { hasAccounts, accounts: storedAccounts } = useAccountStorage()
  const { derivationAccounts } = route.params
  const [selected, setSelected] = React.useState<Set<string>>(
    new Set(derivationAccounts.map((item) => item.path)),
  )
  const { t } = useTranslation()
  const { connection } = useSolana()
  const [loaded, setLoaded] = useState<{
    source: KeystoneAccountType[]
    accounts: KeystoneAccountType[]
  }>()
  const loading = loaded?.source !== derivationAccounts
  const accounts = (!loading && loaded?.accounts) || derivationAccounts
  // Only selected accounts that are not stored yet count against the limit
  const newAccountCount = accounts.filter(
    ({ path, publicKey }) =>
      selected.has(path) &&
      !storedAccounts?.[
        solAddressToHelium(base58.encode(Buffer.from(publicKey, 'hex')))
      ],
  ).length
  const reachedAccountLimit =
    Object.keys(storedAccounts || {}).length + newAccountCount > MAX_ACCOUNTS
  // storage the selected accounts
  const storageSelectedAccounts = () => {
    const selectedAccounts: KeystoneAccountType[] = Array.from(selected).map(
      (path) => {
        const account = accounts.find((item) => item.path === path)
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
    })
  }
  // next page
  const navigation = useNavigation<RootNavigationProp>()

  const onNext = () => {
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
  }

  useEffect(() => {
    const fetchBalance = async (publicKey: string) => {
      if (connection) {
        const balance = await connection.getBalance(
          new PublicKey(base58.encode(Buffer.from(publicKey, 'hex'))),
        )
        return balance.toString()
      }
      return '0'
    }
    async function fetchBalanceForAccounts() {
      const accountsWithBalance: KeystoneAccountType[] = []
      for (const account of derivationAccounts) {
        const balance = await retryWithBackoff(() =>
          fetchBalance(account.publicKey),
        )
        accountsWithBalance.push({ ...account, balanceSol: balance })
      }
      return accountsWithBalance
    }
    void fetchBalanceForAccounts().then((accountsWithBalance) => {
      setLoaded({ source: derivationAccounts, accounts: accountsWithBalance })
    })
  }, [connection, derivationAccounts])

  const renderItem = ({
    item,
    index,
  }: {
    item: KeystoneAccountType
    index: number
  }) => {
    const onSelect = () => {
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(item.path as string)) {
          next.delete(item.path as string)
        } else {
          next.add(item.path as string)
        }
        return next
      })
    }
    const isSelected = selected.has(item.path as string)

    return (
      <PressableScale
        feedback="opacity"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        onPress={onSelect}
        className={`min-h-[72px] flex-row items-center border-border p-4 ${
          index === derivationAccounts.length - 1 ? 'border-b-0' : 'border-b'
        }`}
      >
        <View className="flex-1 px-4">
          <View className="flex-col justify-start">
            <Text size="base" maxFontSizeMultiplier={1.3}>
              {item.path}
            </Text>
            <Text
              className="font-medium text-muted-foreground"
              maxFontSizeMultiplier={1.3}
            >
              {ellipsizeAddress(
                base58.encode(Buffer.from(item.publicKey, 'hex')),
              )}
            </Text>
            <Text
              className="font-medium text-muted-foreground"
              maxFontSizeMultiplier={1.3}
            >
              {item.balanceSol
                ? humanReadable(new BN(item.balanceSol), 9)
                : '0'}{' '}
              SOL
            </Text>
          </View>
        </View>
        <View className="me-1 items-center justify-center">
          <Checkbox
            accessible={false}
            importantForAccessibility="no"
            checked={isSelected}
            onChange={onSelect}
          />
        </View>
      </PressableScale>
    )
  }
  return (
    <View className="flex-1 bg-secondary">
      <View className="h-full flex-1 bg-secondary">
        <SafeArea edges={['top']}>
          <Text size="4xl" className="mt-8 mb-2 text-center">
            {t('keystone.selectKeystoneAccounts.title')}
          </Text>
          <Text size="base" className="mb-6 p-2 text-center">
            {t('keystone.selectKeystoneAccounts.subtitle')}
          </Text>
        </SafeArea>
        <FlatList
          refreshControl={
            <RefreshControl
              enabled
              refreshing={loading}
              onRefresh={() => {}}
              title=""
              tintColorClassName="accent-foreground"
            />
          }
          data={accounts}
          renderItem={renderItem}
          keyExtractor={(item) => item.path as string}
          refreshing={loading}
          onEndReached={() => {}}
        />

        {reachedAccountLimit && (
          <Text
            size="base"
            className="mx-6 mt-4 text-center font-medium text-destructive"
          >
            {t('accountImport.accountLimitLedger')}
          </Text>
        )}
        <SafeArea edges={['bottom']}>
          <Button
            variant="cta"
            size="dashboard"
            className="mx-6 mt-6 mb-6"
            disabled={selected.size === 0 || reachedAccountLimit}
            onPress={onNext}
          >
            Next
          </Button>
        </SafeArea>
      </View>
    </View>
  )
}

export default SelectKeystoneAccountsScreen
