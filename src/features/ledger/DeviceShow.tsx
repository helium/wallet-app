import React, { useCallback, memo, useState, useMemo, useEffect } from 'react'
import { ActivityIndicator, Image, SectionList } from 'react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import Ledger from '@assets/images/ledger.svg'
import ArrowRight from '@assets/images/arrowRight.svg'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Box from '@components/Box'
import Text from '@components/Text'
import ButtonPressable from '@components/ButtonPressable'
import { useColors, useSpacing } from '@theme/themeHooks'
import BackButton from '@components/BackButton'
import { CSAccountVersion, CSAccounts } from '@storage/cloudStorage'
import useLedger, { LedgerAccount } from '@hooks/useLedger'
import {
  LedgerNavigatorNavigationProp,
  LedgerNavigatorStackParamList,
} from './ledgerNavigatorTypes'
import {
  useAccountStorage,
  MAX_ACCOUNTS,
} from '../../storage/AccountStorageProvider'
import LedgerAccountListItem, { Section } from './LedgerAccountListItem'
import { HomeNavigationProp } from '../home/homeTypes'

type Route = RouteProp<LedgerNavigatorStackParamList, 'DeviceShow'>

type SectionData = {
  section: {
    title: string
    index: number
  }
}
const DeviceShow = () => {
  const homeNav = useNavigation<HomeNavigationProp>()
  const navigation = useNavigation<LedgerNavigatorNavigationProp>()
  const route = useRoute<Route>()
  const { ledgerDevice } = route.params
  const { t } = useTranslation()
  const { accounts, upsertAccounts } = useAccountStorage()
  const {
    updateLedgerAccounts,
    ledgerAccounts,
    ledgerAccountsLoading: isScanning,
  } = useLedger()
  const [newLedgerAccounts, setNewLedgerAccounts] = useState<LedgerAccount[]>(
    [],
  )
  const [existingLedgerAccounts, setExistingLedgerAccounts] = useState<
    LedgerAccount[]
  >([])
  const [selectAll, setSelectAll] = useState<boolean>(true)
  const [selectedAccounts, setSelectedAccounts] = useState<
    Record<string, boolean>
  >({})

  const spacing = useSpacing()
  const colors = useColors()
  const accountsToAdd = useMemo(
    () => newLedgerAccounts.filter((a) => selectedAccounts[a.address]),

    [newLedgerAccounts, selectedAccounts],
  )

  useEffect(() => {
    const selected = {} as Record<string, boolean>
    ledgerAccounts.forEach((a) => {
      if (selected[a.address] === undefined) {
        selected[a.address] = true
      }
    })

    setSelectedAccounts(selected)
  }, [ledgerAccounts])

  const reachedAccountLimit = useMemo(() => {
    const { length } = Object.keys(accounts as CSAccounts)

    const selectedCount = Object.keys(selectedAccounts).filter(
      (key) => !!selectedAccounts[key],
    ).length

    return length + selectedCount > MAX_ACCOUNTS
  }, [accounts, selectedAccounts])

  const canAddAccounts = useMemo(
    () => !reachedAccountLimit && accountsToAdd.length,
    [accountsToAdd.length, reachedAccountLimit],
  )

  const SectionData = useMemo((): {
    title: string
    index: number
    data: LedgerAccount[]
  }[] => {
    const sections = [
      {
        title: t('ledger.show.addNewAccount'),
        index: Section.NEW_ACCOUNT,
        data: newLedgerAccounts,
      },
    ]

    if (existingLedgerAccounts?.length > 0) {
      sections.push({
        title: t('ledger.show.accountsAlreadyLinked', {
          count: existingLedgerAccounts.length,
        }),
        index: Section.ALREADY_LINKED,
        data: existingLedgerAccounts,
      })
    }
    return sections
  }, [newLedgerAccounts, existingLedgerAccounts, t])

  const contentContainer = useMemo(
    () => ({
      paddingBottom: spacing.xl,
    }),
    [spacing.xl],
  )

  const keyExtractor = useCallback(
    (item: { address: string }, index: number) => item.address + index,
    [],
  )

  const onSelectAll = useCallback(() => {
    setSelectAll((s) => {
      const next = !s

      const selected = {} as Record<string, boolean>
      ledgerAccounts.forEach((a) => {
        selected[a.address] = next
      })
      setSelectedAccounts(selected)

      return next
    })
  }, [ledgerAccounts])

  // Show page header on first section of section list
  const PageHeader = useCallback(() => {
    return (
      <>
        <BackButton
          marginVertical="m"
          paddingHorizontal="m"
          marginHorizontal="s"
          onPress={navigation.goBack}
        />
        <Box
          marginBottom="xl"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
        >
          <Ledger width={62} height={62} color={colors.primaryText} />
          <Box marginHorizontal="m">
            <ArrowRight color="white" />
          </Box>
          <Image source={require('@assets/images/fingerprintGreen.png')} />
        </Box>
        <Text variant="h2" textAlign="center">
          {t('ledger.show.title')}
        </Text>
        <Text
          variant="subtitle1"
          color="greenBright500"
          marginTop="l"
          textAlign="center"
        >
          {t('ledger.show.subtitle')}
        </Text>
        <Text
          visible={reachedAccountLimit}
          variant="body1"
          textAlign="center"
          color="error"
          fontWeight="500"
          marginTop="m"
        >
          {t('accountImport.accountLimitLedger')}
        </Text>
        {isScanning && (
          <Box marginVertical="l" backgroundColor="primaryBackground">
            <ActivityIndicator />
          </Box>
        )}
      </>
    )
  }, [
    colors.primaryText,
    isScanning,
    navigation.goBack,
    t,
    reachedAccountLimit,
  ])

  const renderSectionHeader = useCallback(
    ({ section: { title, index } }: SectionData) => (
      <Box backgroundColor="primaryBackground">
        {index === 0 && PageHeader()}
        <Box
          marginHorizontal="s"
          flexDirection="row"
          alignItems="center"
          paddingTop="xl"
          paddingBottom="m"
          paddingHorizontal="l"
        >
          <Text flexGrow={1} variant="body2" fontWeight="bold">
            {title}
          </Text>

          {index === 0 && (
            <TouchableOpacity onPress={onSelectAll}>
              <Text variant="body2" fontWeight="bold">
                {selectAll
                  ? t('ledger.show.deselectAll')
                  : t('ledger.show.selectAll')}
              </Text>
            </TouchableOpacity>
          )}
        </Box>
      </Box>
    ),
    [PageHeader, onSelectAll, selectAll, t],
  )

  const renderSectionFooter = useCallback(
    ({ section: { index } }: SectionData) => {
      if (isScanning || ledgerAccounts.length === 0) return null
      return (
        <Box backgroundColor="primaryBackground">
          {index === 0 && newLedgerAccounts?.length === 0 && (
            <Text
              paddingHorizontal="xl"
              variant="body1"
              color="grey500"
              textAlign="left"
            >
              {t('ledger.show.emptyAccount', {
                account:
                  existingLedgerAccounts[existingLedgerAccounts.length - 1]
                    ?.alias,
              })}
            </Text>
          )}
        </Box>
      )
    },
    [existingLedgerAccounts, isScanning, ledgerAccounts, newLedgerAccounts, t],
  )

  useAsync(async () => {
    try {
      await updateLedgerAccounts(ledgerDevice)
    } catch (error) {
      // in this case, user is likely not on Helium app

      console.error(error)
      navigation.navigate('DeviceScan', { error: error as Error })
    }
  }, [])

  useEffect(() => {
    const accountAddresses = Object.keys(accounts || {})

    setExistingLedgerAccounts([
      ...ledgerAccounts.filter((a) => accountAddresses.includes(a.address)),
    ])

    setNewLedgerAccounts([
      ...ledgerAccounts.filter((a) => !accountAddresses.includes(a.address)),
    ])
  }, [accounts, ledgerAccounts, selectedAccounts])

  const handleNext = useCallback(async () => {
    if (!accountsToAdd) return
    const accs = accountsToAdd?.map((acc) => {
      return {
        alias: acc.alias,
        address: acc.address,
        ledgerDevice,
        ledgerIndex: acc.accountIndex,
        solanaAddress: acc.solanaAddress,
        version: 'v1' as CSAccountVersion,
      }
    })

    await upsertAccounts(accs)

    navigation.navigate('PairSuccess')
  }, [accountsToAdd, ledgerDevice, navigation, upsertAccounts])

  const handleClose = useCallback(() => {
    homeNav.navigate('AccountsScreen')
  }, [homeNav])

  const onCheckboxToggled = useCallback(
    (account: LedgerAccount, value: boolean) => {
      setSelectedAccounts((selected) => {
        return { ...selected, [account.address]: value }
      })
    },
    [],
  )

  if (!ledgerAccounts) {
    return (
      <Box
        flex={1}
        backgroundColor="primaryBackground"
        justifyContent="center"
        alignItems="center"
      >
        <ActivityIndicator />
      </Box>
    )
  }

  return (
    <Box flex={1} backgroundColor="primaryBackground">
      <Box height="89%">
        <SectionList
          stickySectionHeadersEnabled={false}
          contentContainerStyle={contentContainer}
          sections={SectionData}
          keyExtractor={keyExtractor}
          renderItem={(vals) => (
            <LedgerAccountListItem
              {...vals}
              isSelected={selectedAccounts[vals.item.address]}
              onCheckboxToggled={onCheckboxToggled}
            />
          )}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          initialNumToRender={100}
        />
      </Box>
      <Box
        backgroundColor="primaryBackground"
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        borderTopColor="secondaryIcon"
        borderTopWidth={1}
        height="11%"
      >
        <ButtonPressable
          marginTop="m"
          borderRadius="round"
          backgroundColor="surfaceSecondary"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="surfaceSecondary"
          backgroundColorDisabledOpacity={0.5}
          titleColorDisabled="black500"
          onPress={canAddAccounts ? handleNext : handleClose}
          title={
            canAddAccounts ? t('ledger.show.next') : t('ledger.show.close')
          }
          marginBottom="xs"
          marginHorizontal="l"
        />
      </Box>
    </Box>
  )
}

export default memo(DeviceShow)
