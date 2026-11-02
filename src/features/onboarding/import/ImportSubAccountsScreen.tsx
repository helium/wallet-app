import { FocusAwareStatusBar } from '@ui/FocusAwareStatusBar'
import { useMint } from '@helium/helium-react-hooks'
import {
  ResolvedPath,
  useDerivationAccounts,
} from '@hooks/useDerivationAccounts'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { DEFAULT_DERIVATION_PATH } from '@storage/secureStorage'
import { Button } from '@ui/Button'
import { Checkbox } from '@ui/Checkbox'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { ellipsizeAddress } from '@utils/accountUtils'
import { humanReadable } from '@utils/formatting'
import BN from 'bn.js'
import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, RefreshControl, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RootNavigationProp } from 'src/navigation/rootTypes'
import { withUniwind } from 'uniwind'
import { useOnboarding } from '../OnboardingProvider'

const SafeArea = withUniwind(SafeAreaView)

const TokenItem = ({ mint, amount }: { mint: PublicKey; amount: bigint }) => {
  const decimals = useMint(mint).info?.decimals
  const { symbol } = useMetaplexMetadata(mint)

  return (
    <Text
      className="font-medium text-navy-foreground/50"
      maxFontSizeMultiplier={1.3}
    >
      {humanReadable(new BN(amount.toString() || 0), decimals)} {symbol}
    </Text>
  )
}
const ImportSubAccountsScreen = () => {
  const { t } = useTranslation()
  const { hasAccounts } = useAccountStorage()
  const { onboardingData, setOnboardingData } = useOnboarding()
  const { words } = onboardingData
  const mnemonic =
    !words || words.length === 0
      ? undefined
      : words
          .filter((word) => word && word.trim())
          .join(' ')
          .trim()
  const {
    error,
    loading,
    derivationAccounts: foundAccounts,
    fetchMore,
  } = useDerivationAccounts({ mnemonic })

  // Memoised by hand: the effect below writes onboarding data on each new
  // array, and the compiler does not memoise this value.
  const derivationAccounts = useMemo(
    () =>
      foundAccounts.filter(
        (acc) =>
          (acc.tokens?.length || 0) > 0 ||
          (acc?.balance || 0) > 0 ||
          acc.needsMigrated ||
          acc.derivationPath === DEFAULT_DERIVATION_PATH,
      ),
    [foundAccounts],
  )

  const [selected, setSelected] = React.useState<Set<string>>(
    new Set([DEFAULT_DERIVATION_PATH]),
  )
  const [hasInitialized, setHasInitialized] = React.useState(false)

  if (derivationAccounts.length > 0 && !hasInitialized) {
    setSelected(
      new Set([
        ...derivationAccounts.map((d) => d.derivationPath),
        DEFAULT_DERIVATION_PATH,
      ]),
    )
    setHasInitialized(true)
  }

  useEffect(() => {
    setOnboardingData((data) => ({
      ...data,
      paths: derivationAccounts.filter((acc) =>
        selected?.has(acc.derivationPath),
      ),
    }))
  }, [setOnboardingData, selected, derivationAccounts])

  const renderItem = ({ item }: { item: ResolvedPath }) => {
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
      <PressableScale
        feedback="opacity"
        onPress={onSelect}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        className="mx-4 mb-2 min-h-[72px] flex-row items-center rounded-[12px] bg-navy-glass p-4"
      >
        <View className="flex-1 px-4">
          <Text
            size="base"
            className="text-navy-foreground"
            maxFontSizeMultiplier={1.3}
          >
            {item.derivationPath}
          </Text>
          <Text
            className="font-medium text-navy-foreground/50"
            maxFontSizeMultiplier={1.3}
          >
            {ellipsizeAddress(item.keypair.publicKey.toBase58())}
          </Text>
          <Text
            className="font-medium text-navy-foreground/50"
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
              className="font-medium text-navy-foreground/50"
              maxFontSizeMultiplier={1.3}
            >
              {t('accountImport.privateKey.needsMigration')}
            </Text>
          ) : null}
        </View>
        <View className="me-1 items-center justify-center">
          <Checkbox
            checked={isSelected}
            onChange={onSelect}
            accessible={false}
            importantForAccessibility="no"
            className={
              isSelected
                ? 'border-purple-500 bg-purple-500'
                : 'border-navy-foreground/50'
            }
          />
        </View>
      </PressableScale>
    )
  }

  const keyExtractor = (item: ResolvedPath) => item.derivationPath

  const navigation = useNavigation<RootNavigationProp>()

  const onNext = () => {
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
  }

  return (
    <SafeArea className="flex-1 bg-navy">
      <FocusAwareStatusBar barStyle="light-content" />
      <Text
        size="4xl"
        className="mb-2 mt-8 text-center font-medium leading-[44px] text-navy-foreground"
      >
        {t('accountImport.privateKey.selectAccounts')}
      </Text>
      <Text size="base" className="mb-6 p-2 text-center text-navy-foreground">
        {t('accountImport.privateKey.selectAccountsBody')}
      </Text>
      {error && (
        <Text className="mb-6 text-center text-destructive">
          {error.message}
        </Text>
      )}
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            enabled
            refreshing={loading}
            onRefresh={() => {}}
            title=""
            tintColorClassName="accent-navy-foreground"
          />
        }
        data={derivationAccounts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        refreshing={loading}
        onEndReached={fetchMore}
      />
      {!!derivationAccounts.length && (
        <Button
          variant="cta"
          size="dashboard"
          className="mx-6 my-6"
          disabled={!selected || selected.size === 0 || !!error || loading}
          onPress={onNext}
          testID="ImportSubAccounts.Next"
        >
          {t('generic.next')}
        </Button>
      )}
    </SafeArea>
  )
}

export default ImportSubAccountsScreen
