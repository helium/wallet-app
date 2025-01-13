import Box from '@components/Box'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import {
  ResolvedPath,
  useDerivationAccounts,
} from '@hooks/useDerivationAccounts'
import CheckBox from '@react-native-community/checkbox'
import { DEFAULT_DERIVATION_PATH } from '@config/storage/secureStorage'
import { useColors } from '@config/theme/themeHooks'
import { ellipsizeAddress } from '@utils/accountUtils'
import { humanReadable } from '@utils/formatting'
import BN from 'bn.js'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import ScrollBox from '@components/ScrollBox'
import CircleLoader from '@components/CircleLoader'
import ForwardButton from '@components/ForwardButton'
import { PublicKey } from '@solana/web3.js'
import { useMint } from '@helium/helium-react-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useOnboardingSheet } from '../OnboardingSheet'
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
  const { onboardingData, setOnboardingData } = useOnboarding()
  const { carouselRef } = useOnboardingSheet()
  const { words } = onboardingData

  const mnemonic = useMemo(() => words?.join(' '), [words])

  const {
    error,
    derivationAccounts: foundAccounts,
    fetchMore,
  } = useDerivationAccounts({ mnemonic })

  const derivationAccounts = useMemo(() => {
    return foundAccounts.filter(
      (acc) =>
        (acc.tokens?.length || 0) > 0 ||
        (acc?.balance || 0) > 0 ||
        (acc.nfts?.length || 0) > 0 ||
        acc.needsMigrated ||
        acc.derivationPath === DEFAULT_DERIVATION_PATH,
    )
  }, [foundAccounts])

  const colors = useColors()
  const [selected, setSelected] = React.useState<Set<string>>(
    new Set([DEFAULT_DERIVATION_PATH]),
  )

  useEffect(() => {
    setSelected(
      new Set([
        ...derivationAccounts.map((d) => d.derivationPath),
        DEFAULT_DERIVATION_PATH,
      ]),
    )
  }, [derivationAccounts])

  useEffect(() => {
    setOnboardingData((data) => ({
      ...data,
      paths: derivationAccounts.filter((acc) =>
        selected.has(acc.derivationPath),
      ),
    }))
  }, [setOnboardingData, selected, derivationAccounts])

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item, index }: { item: ResolvedPath; index: number }) => {
      const isFirst = index === 0
      const isLast = index === derivationAccounts.length - 1
      const borderTopStartRadius = isFirst ? 'xl' : 'none'
      const borderTopEndRadius = isFirst ? 'xl' : 'none'
      const borderBottomStartRadius = isLast ? 'xl' : 'none'
      const borderBottomEndRadius = isLast ? 'xl' : 'none'

      const onSelect = () => {
        if (selected.has(item.derivationPath)) {
          selected.delete(item.derivationPath)
          setSelected(new Set(selected))
        } else {
          selected.add(item.derivationPath)
          setSelected(new Set(selected))
        }
      }
      return (
        <TouchableContainer
          onPress={onSelect}
          flexDirection="row"
          minHeight={72}
          alignItems="center"
          paddingHorizontal="4"
          paddingVertical="4"
          borderBottomColor="primaryBackground"
          borderBottomWidth={index === derivationAccounts.length - 1 ? 0 : 2}
          borderTopStartRadius={borderTopStartRadius}
          borderTopEndRadius={borderTopEndRadius}
          borderBottomStartRadius={borderBottomStartRadius}
          borderBottomEndRadius={borderBottomEndRadius}
        >
          <Box flex={1} paddingHorizontal="4">
            <Box flexDirection="column" justifyContent="flex-start">
              <Text
                variant="textMdRegular"
                color="primaryText"
                maxFontSizeMultiplier={1.3}
              >
                {item.derivationPath}
              </Text>
              <Text
                variant="textSmMedium"
                color="secondaryText"
                maxFontSizeMultiplier={1.3}
              >
                {ellipsizeAddress(item.keypair.publicKey.toBase58())}
              </Text>
              <Text
                variant="textSmMedium"
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
              {(item.nfts?.length || 0) > 0 ? (
                <Text
                  variant="textSmMedium"
                  color="secondaryText"
                  maxFontSizeMultiplier={1.3}
                >
                  {`${
                    item.nfts?.length === 10 ? '10+' : item.nfts?.length
                  } NFTs`}
                </Text>
              ) : null}
              {item.needsMigrated ? (
                <Text
                  variant="textSmMedium"
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
              value={selected.has(item.derivationPath)}
              style={{ height: 18, width: 18 }}
              tintColors={{
                true: colors.primaryText,
                false: colors.primaryText,
              }}
              onCheckColor={colors.primaryBackground}
              onTintColor={colors.primaryText}
              tintColor={colors.primaryText}
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
    [colors, derivationAccounts, selected, t],
  )

  const keyExtractor = useCallback(
    (item: ResolvedPath) => item.derivationPath,
    [],
  )

  const onNext = useCallback(() => {
    carouselRef?.current?.snapToNext()
  }, [carouselRef])

  if (error) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" gap="xl">
        <Text variant="displayMdSemibold" color="primaryText">
          {t('accountImport.privateKey.error')}
        </Text>
        <Text variant="textXlRegular" color="error.500">
          {error.message}
        </Text>
      </Box>
    )
  }

  if (foundAccounts?.length === 0) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" gap="xl">
        <CircleLoader type="blue" loaderSize={60} />
        <Text variant="displayMdSemibold" color="primaryText">
          {t('accountImport.privateKey.findingWallet')}
        </Text>
        <Text variant="textXlRegular" color="text.quaternary-500">
          {t('accountImport.privateKey.thisWontTakeLong')}
        </Text>
      </Box>
    )
  }

  return (
    <ScrollBox
      backgroundColor="transparent"
      contentContainerStyle={{
        flex: 1,
      }}
    >
      <SafeAreaBox flex={1}>
        <Box flex={1} paddingHorizontal="4">
          <Text
            color="primaryText"
            variant="displayMdSemibold"
            mt="8"
            textAlign="center"
            fontSize={44}
            lineHeight={44}
            mb="2"
          >
            {derivationAccounts?.length > 1
              ? t('accountImport.privateKey.walletsFound', {
                  count: derivationAccounts?.length,
                })
              : t('accountImport.privateKey.walletFound')}
          </Text>
          <Text
            textAlign="center"
            p="2"
            variant="textXlRegular"
            mb="6"
            color="text.quaternary-500"
          >
            {t('accountImport.privateKey.selectAccountsBody')}
          </Text>
          <FlatList
            data={derivationAccounts}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onEndReached={fetchMore}
          />
        </Box>
      </SafeAreaBox>
      <ForwardButton onPress={onNext} />
    </ScrollBox>
  )
}
