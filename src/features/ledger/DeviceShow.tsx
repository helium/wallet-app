import React, { useCallback, memo, useState, useMemo, useEffect } from 'react'
import { ActivityIndicator, Image, SectionList } from 'react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import Ledger from '@assets/images/ledger.svg'
import ArrowRight from '@assets/images/arrowRight.svg'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Box from '../../components/Box'
import Text from '../../components/Text'
import ButtonPressable from '../../components/ButtonPressable'
import {
  LedgerNavigatorNavigationProp,
  LedgerNavigatorStackParamList,
} from './ledgerNavigatorTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import {
  getLedgerAddress,
  LedgerAccount,
  useLedger,
  useLedgerAccounts,
  setLedgerAccounts,
} from '../../utils/heliumLedger'
import { useColors, useSpacing } from '../../theme/themeHooks'
import AccountListItem from './AccountListItem'
import BackButton from '../../components/BackButton'
import { useOnboarding } from '../onboarding/OnboardingProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import { CSAccounts } from '../../storage/cloudStorage'

const MAX_ACCOUNTS = 10

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
  const { transport, getTransport } = useLedger()
  const [newLedgerAccounts, setNewLedgerAccounts] = useState<LedgerAccount[]>(
    [],
  )
  const [existingLedgerAccounts, setExistingLedgerAccounts] = useState<
    LedgerAccount[]
  >([])
  const [reachedAccountLimit, setReachedAccountLimit] = useState(false)
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [selectAll, setSelectAll] = useState<boolean>(false)

  const spacing = useSpacing()
  const ledgerAccounts = useLedgerAccounts()
  const colors = useColors()
  const {
    onboardingData: { netType },
  } = useOnboarding()

  const SectionData = useMemo((): {
    title: string
    index: number
    data: LedgerAccount[]
  }[] => {
    const sections = [
      {
        title: t('ledger.show.addNewAccount'),
        index: 0,
        data: newLedgerAccounts,
      },
    ]

    if (existingLedgerAccounts?.length > 0) {
      sections.push({
        title: t('ledger.show.accountsAlreadyLinked', {
          count: existingLedgerAccounts.length,
        }),
        index: 1,
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
    setLedgerAccounts(
      ledgerAccounts.map((account) => {
        if (newLedgerAccounts?.includes(account)) {
          return { ...account, isSelected: selectAll }
        }

        return account
      }),
    )
    setSelectAll((s) => !s)
  }, [ledgerAccounts, newLedgerAccounts, selectAll])

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
            <ArrowRight />
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
                  ? t('ledger.show.selectAll')
                  : t('ledger.show.deselectAll')}
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
                    .alias,
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
      const ledgerTransport = await getTransport(
        ledgerDevice.id,
        ledgerDevice.type,
      )
      if (!ledgerTransport) return

      setIsScanning(true)
      await getLedgerAddress(ledgerTransport, accounts, netType)
      setIsScanning(false)
    } catch (error) {
      if (isScanning) return

      // in this case, user is likely not on Helium app
      console.error(error)
      navigation.navigate('DeviceScan', { error: error as Error })
    }
  }, [])

  useEffect(() => {
    if (ledgerAccounts.length === 0) {
      return
    }

    if (!accounts) {
      setNewLedgerAccounts(ledgerAccounts)
      return
    }

    const accountAddresses = Object.keys(accounts)
    const { length } = Object.keys(accounts as CSAccounts)

    const selectedAccounts = ledgerAccounts.filter(
      (account) => account.isSelected,
    )

    setReachedAccountLimit(length + selectedAccounts.length > MAX_ACCOUNTS)

    setExistingLedgerAccounts([
      ...ledgerAccounts.filter((a) => accountAddresses.includes(a.address)),
    ])

    setNewLedgerAccounts([
      ...ledgerAccounts.filter((a) => !accountAddresses.includes(a.address)),
    ])
  }, [accounts, ledgerAccounts])

  const next = useCallback(async () => {
    if (!newLedgerAccounts) return
    const accs = newLedgerAccounts?.map((acc) => {
      const ledgerIndex = ledgerAccounts.indexOf(acc)
      return {
        alias: acc.alias,
        address: acc.address,
        ledgerDevice,
        ledgerIndex,
      }
    })

    await upsertAccounts(accs)

    navigation.navigate('PairSuccess')
  }, [
    ledgerAccounts,
    ledgerDevice,
    navigation,
    newLedgerAccounts,
    upsertAccounts,
  ])

  const close = useCallback(() => {
    homeNav.navigate('AccountsScreen')
  }, [homeNav])

  if (!transport || !ledgerAccounts) {
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
          renderItem={(props) => <AccountListItem {...props} />}
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
          disabled={reachedAccountLimit}
          marginTop="m"
          borderRadius="round"
          backgroundColor="surfaceSecondary"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="surfaceSecondary"
          backgroundColorDisabledOpacity={0.5}
          titleColorDisabled="black500"
          onPress={newLedgerAccounts.length === 0 ? close : next}
          title={
            newLedgerAccounts.length === 0
              ? t('ledger.show.close')
              : t('ledger.show.next')
          }
          marginBottom="xs"
          marginHorizontal="l"
        />
      </Box>
    </Box>
  )
}

export default memo(DeviceShow)
