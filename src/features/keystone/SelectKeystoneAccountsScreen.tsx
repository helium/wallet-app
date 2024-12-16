/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-restricted-syntax */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Box from '@components/Box'
import Text from '@components/Text'
import { FlatList, RefreshControl } from 'react-native'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import CheckBox from '@react-native-community/checkbox'
import TouchableContainer from '@components/TouchableContainer'
import { humanReadable } from '@helium/spl-utils'
import BN from 'bn.js'
import { ellipsizeAddress } from '@utils/accountUtils'
import base58 from 'bs58'
import { retryWithBackoff } from '@utils/retryWithBackoff'
import { PublicKey } from '@solana/web3.js'
import { useTranslation } from 'react-i18next'
import { useSolana } from '@features/solana/SolanaProvider'
import { useOnboardingSheet } from '@features/onboarding/OnboardingSheet'
import ForwardButton from '@components/ForwardButton'
import ScrollBox from '@components/ScrollBox'
import { useBottomSpacing } from '@hooks/useBottomSpacing'
import { useKeystoneOnboarding } from './KeystoneOnboardingProvider'

export type KeystoneAccountType = {
  path: string
  publicKey: string
  masterFingerprint: string
  device: string
  balanceSol?: string
}

const SelectKeystoneAccountsScreen = () => {
  const bottomSpacing = useBottomSpacing()
  const colors = useColors()
  const spacing = useSpacing()
  const {
    setKeystoneOnboardingData,
    keystoneOnboardingData: { derivationAccounts },
  } = useKeystoneOnboarding()
  const [selected, setSelected] = React.useState<string[]>(
    derivationAccounts.map((item) => item.path).slice(0, 1),
  )
  const { t } = useTranslation()
  const [loading, setLoading] = useState<boolean>(true)
  const { connection } = useSolana()
  const { carouselRef } = useOnboardingSheet()
  // storage the selected accounts
  const storageSelectedAccounts = () => {
    const selectedAccounts: KeystoneAccountType[] = Array.from(selected).map(
      (path) => {
        const account = derivationAccounts.find((item) => item.path === path)
        return {
          path,
          publicKey: account?.publicKey || '',
          masterFingerprint: account?.masterFingerprint || '',
          device: account?.device || '',
          balanceSol: account?.balanceSol || '0',
        }
      },
    )
    setKeystoneOnboardingData((o) => ({
      ...o,
      accounts: selectedAccounts,
    }))
  }

  const onNext = useCallback(() => {
    storageSelectedAccounts()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    carouselRef?.current?.snapToNext()
  }, [selected, carouselRef])

  const fetchBalance = async (publicKey: string) => {
    if (connection) {
      const balance = await connection.getBalance(
        new PublicKey(base58.encode(Buffer.from(publicKey, 'hex'))),
      )
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

  const onSelect = useCallback(
    (item: KeystoneAccountType) => () => {
      if (selected.includes(item.path)) {
        setSelected((s) => s.filter((path) => path !== item.path))
      } else {
        setSelected((s) => [...s, item.path])
      }
    },
    [selected],
  )

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item, index }: { item: KeystoneAccountType; index: number }) => {
      const isFirstItem = index === 0
      const isLastItem = index === derivationAccounts.length - 1
      const borderTopStartRadius = isFirstItem ? '2xl' : 'none'
      const borderTopEndRadius = isFirstItem ? '2xl' : 'none'
      const borderBottomStartRadius = isLastItem ? '2xl' : 'none'
      const borderBottomEndRadius = isLastItem ? '2xl' : 'none'

      return (
        <TouchableContainer
          onPress={onSelect(item)}
          flexDirection="row"
          minHeight={72}
          alignItems="center"
          paddingHorizontal="4"
          paddingVertical="4"
          borderBottomColor="primaryBackground"
          borderBottomWidth={index === derivationAccounts.length - 1 ? 0 : 1}
          borderTopStartRadius={borderTopStartRadius}
          borderTopEndRadius={borderTopEndRadius}
          borderBottomStartRadius={borderBottomStartRadius}
          borderBottomEndRadius={borderBottomEndRadius}
        >
          <Box flex={1} paddingHorizontal="4">
            <Box flexDirection="column" justifyContent="flex-start">
              <Text
                variant="textSmRegular"
                color="primaryText"
                maxFontSizeMultiplier={1.3}
              >
                {item.path}
              </Text>
              <Text
                variant="textMdMedium"
                color="secondaryText"
                maxFontSizeMultiplier={1.3}
              >
                {ellipsizeAddress(
                  base58.encode(Buffer.from(item.publicKey, 'hex')),
                )}
              </Text>
              <Text
                variant="textMdMedium"
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
              value={selected.includes(item.path)}
              style={{ height: 18, width: 18 }}
              tintColors={{
                true: colors.primaryText,
                false: colors.secondaryText,
              }}
              onCheckColor={colors.primaryBackground}
              onTintColor={colors.primaryText}
              tintColor={colors.secondaryText}
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
    [colors, derivationAccounts, selected],
  )

  const Header = useCallback(() => {
    return (
      <Box gap="xl" mb="2xl">
        <Text
          color="primaryText"
          variant="displayMdSemibold"
          mt="2xl"
          textAlign="center"
          mb="1"
        >
          {t('keystone.selectKeystoneAccounts.title')}
        </Text>
        <Text
          textAlign="center"
          paddingHorizontal="2xl"
          variant="textMdRegular"
          color="text.quaternary-500"
        >
          {t('keystone.selectKeystoneAccounts.subtitle')}
        </Text>
      </Box>
    )
  }, [t])

  const contentContainerStyle = useMemo(() => {
    return {
      padding: spacing['2xl'],
      flex: 1,
      paddingBottom: bottomSpacing,
    }
  }, [spacing, bottomSpacing])

  return (
    <>
      <ScrollBox
        flex={1}
        refreshControl={
          <RefreshControl
            enabled
            refreshing={loading}
            onRefresh={() => {}}
            title=""
            tintColor={colors.primaryText}
          />
        }
      >
        <FlatList
          contentContainerStyle={contentContainerStyle}
          data={derivationAccounts}
          renderItem={renderItem}
          keyExtractor={(item) => item.path as string}
          refreshing={loading}
          ListHeaderComponent={Header}
          onEndReached={() => {}}
        />
      </ScrollBox>
      {selected.length > 0 && <ForwardButton onPress={onNext} />}
    </>
  )
}

export default SelectKeystoneAccountsScreen
