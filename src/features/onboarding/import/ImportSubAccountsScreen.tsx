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
import { AccountsServiceNavigationProp } from '@services/AccountsService/accountServiceTypes'
import { useOnboarding } from '../OnboardingProvider'

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
        (acc.tokens?.value.length || 0) > 0 ||
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
              {(item.tokens?.value.length || 0) > 0 ? (
                <Text
                  variant="textSmMedium"
                  color="secondaryText"
                  maxFontSizeMultiplier={1.3}
                >
                  {`${item.tokens?.value.length} tokens`}
                </Text>
              ) : null}
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
    [
      colors.primaryText,
      colors.secondaryText,
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
  const accountsNavigation = useNavigation<AccountsServiceNavigationProp>()

  const onNext = useCallback(() => {
    if (hasAccounts) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      accountsNavigation.navigate('AccountAssignScreen', {
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
      <Box
        flex={1}
        backgroundColor="secondaryBackground"
        height="100%"
        paddingHorizontal="4"
      >
        <Text
          variant="displayMdRegular"
          mt="8"
          textAlign="center"
          fontSize={44}
          lineHeight={44}
          mb="2"
        >
          {t('accountImport.privateKey.selectAccounts')}
        </Text>
        <Text textAlign="center" p="2" variant="textMdRegular" mb="6">
          {t('accountImport.privateKey.selectAccountsBody')}
        </Text>
        {error && (
          <Text variant="textSmRegular" color="error.500" textAlign="center">
            {error.message}
          </Text>
        )}
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
          marginTop="6"
          borderRadius="full"
          backgroundColor="primaryText"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="bg.tertiary"
          backgroundColorDisabledOpacity={0.5}
          titleColorDisabled="gray.800"
          titleColor="primaryBackground"
          disabled={selected.size === 0}
          onPress={onNext}
          title={t('generic.next')}
          marginBottom="6"
          marginHorizontal="6"
        />
      </Box>
    </SafeAreaBox>
  )
}
