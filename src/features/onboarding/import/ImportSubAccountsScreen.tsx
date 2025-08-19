import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import {
  ResolvedPath,
  useDerivationAccounts,
} from '@hooks/useDerivationAccounts'
import CheckBox from '@react-native-community/checkbox'
import { useNavigation } from '@react-navigation/native'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { DEFAULT_DERIVATION_PATH } from '@storage/secureStorage'
import { useColors } from '@theme/themeHooks'
import { ellipsizeAddress } from '@utils/accountUtils'
import { humanReadable } from '@utils/formatting'
import BN from 'bn.js'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, RefreshControl } from 'react-native'
import { RootNavigationProp } from 'src/navigation/rootTypes'
import { PublicKey } from '@solana/web3.js'
import { useMint } from '@helium/helium-react-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useOnboarding } from '../OnboardingProvider'

const TokenItem = ({ mint, amount }: { mint: PublicKey; amount: bigint }) => {
  const decimals = useMint(mint).info?.decimals
  const { symbol } = useMetaplexMetadata(mint)

  return (
    <Text
      variant="body2Medium"
      color="secondaryText"
      maxFontSizeMultiplier={1.3}
    >
      {humanReadable(new BN(amount.toString() || 0), decimals)} {symbol}
    </Text>
  )
}
export default () => {
  const { t } = useTranslation()
  const { hasAccounts } = useAccountStorage()
  const { onboardingData, setOnboardingData } = useOnboarding()
  const { words } = onboardingData
  const mnemonic = useMemo(() => words?.join(' '), [words])
  const {
    error,
    loading,
    derivationAccounts: foundAccounts,
    fetchMore,
  } = useDerivationAccounts({ mnemonic })

  const derivationAccounts = useMemo(() => {
    return foundAccounts.filter(
      (acc) =>
        (acc.tokens?.length || 0) > 0 ||
        (acc?.balance || 0) > 0 ||
        acc.needsMigrated ||
        acc.derivationPath === DEFAULT_DERIVATION_PATH,
    )
  }, [foundAccounts])

  const colors = useColors()
  const [selected, setSelected] = React.useState<Set<string>>(
    new Set([DEFAULT_DERIVATION_PATH]),
  )
  const [hasInitialized, setHasInitialized] = React.useState(false)

  useEffect(() => {
    if (derivationAccounts.length > 0 && !hasInitialized) {
      setSelected(
        new Set([
          ...derivationAccounts.map((d) => d.derivationPath),
          DEFAULT_DERIVATION_PATH,
        ]),
      )
      setHasInitialized(true)
    }
  }, [derivationAccounts, hasInitialized])

  useEffect(() => {
    setOnboardingData((data) => ({
      ...data,
      paths: derivationAccounts.filter((acc) =>
        selected?.has(acc.derivationPath),
      ),
    }))
  }, [setOnboardingData, selected, derivationAccounts])

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item, index }: { item: ResolvedPath; index: number }) => {
      const onSelect = () => {
        setSelected((prev) => {
          const newSelected = new Set(prev)
          if (prev?.has(item.derivationPath)) {
            newSelected.delete(item.derivationPath)
          } else {
            newSelected.add(item.derivationPath)
          }
          return newSelected
        })
      }

      const isSelected = selected?.has(item.derivationPath)
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
                {item.derivationPath}
              </Text>
              <Text
                variant="body2Medium"
                color="secondaryText"
                maxFontSizeMultiplier={1.3}
              >
                {ellipsizeAddress(item.keypair.publicKey.toBase58())}
              </Text>
              <Text
                variant="body2Medium"
                color="secondaryText"
                maxFontSizeMultiplier={1.3}
              >
                {humanReadable(new BN(item?.balance || 0), 9)} SOL
              </Text>
              {item.tokens?.map((token) => (
                <TokenItem
                  key={token.mint.toBase58()}
                  mint={token.mint}
                  amount={token.amount}
                />
              ))}
              {item.needsMigrated ? (
                <Text
                  variant="body2Medium"
                  color="secondaryText"
                  maxFontSizeMultiplier={1.3}
                >
                  {t('accountImport.privateKey.needsMigration')}
                </Text>
              ) : null}
            </Box>
          </Box>
          <Box justifyContent="center" alignItems="center" marginEnd="xs">
            <CheckBox
              value={isSelected}
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
              disabled
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
      t,
    ],
  )

  const keyExtractor = useCallback(
    (item: ResolvedPath) => item.derivationPath,
    [],
  )

  const navigation = useNavigation<RootNavigationProp>()

  const onNext = useCallback(() => {
    if (hasAccounts) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      navigation.replace('TabBarNavigator', {
        screen: 'Home',
        params: {
          screen: 'AccountAssignScreen',
          params: {
            words,
          },
        },
      })
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      navigation.replace('OnboardingNavigator', {
        screen: 'CreateAccount',
        params: {
          screen: 'AccountAssignScreen',
          params: {
            words,
          },
        },
      })
    }
  }, [hasAccounts, navigation, words])

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
          {t('accountImport.privateKey.selectAccounts')}
        </Text>
        <Text textAlign="center" p="s" variant="body1" mb="l">
          {t('accountImport.privateKey.selectAccountsBody')}
        </Text>
        {error && <Text color="red500">{error.message}</Text>}
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
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshing={loading}
          onEndReached={fetchMore}
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
          disabled={!selected || selected.size === 0}
          onPress={onNext}
          title={t('generic.next')}
          marginBottom="l"
          marginHorizontal="l"
        />
      </Box>
    </SafeAreaBox>
  )
}
