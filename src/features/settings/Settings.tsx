import Box from '@components/Box'
import CloseButton from '@components/CloseButton'
import ImageBox from '@components/ImageBox'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import { truthy } from '@helium/spl-utils'
import useAlert from '@hooks/useAlert'
import { useAppVersion } from '@hooks/useDevice'
import { useExplorer } from '@hooks/useExplorer'
import { useNavigation } from '@react-navigation/native'
import { Cluster } from '@solana/web3.js'
import { useHitSlop, useSpacing } from '@theme/themeHooks'
import React, { ReactText, memo, useCallback, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Alert, Linking, Platform, SectionList } from 'react-native'
import deviceInfo from 'react-native-device-info'
import { SvgUri } from 'react-native-svg'
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../../constants/urls'
import { RootNavigationProp } from '../../navigation/rootTypes'
import { useSolana } from '../../solana/SolanaProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { useLanguageStorage } from '../../storage/LanguageProvider'
import {
  checkSecureAccount,
  getSecureAccount,
} from '../../storage/secureStorage'
import { persistor } from '../../store/persistence'
import { SUPPORTED_LANGUAGUES } from '../../utils/i18n'
import SUPPORTED_CURRENCIES from '../../utils/supportedCurrencies'
import { HomeNavigationProp } from '../home/homeTypes'
import SettingsListItem, { SettingsListItemType } from './SettingsListItem'
import { SettingsNavigationProp } from './settingsTypes'
import useAuthIntervals from './useAuthIntervals'

const Settings = () => {
  const { t } = useTranslation()
  const homeNav = useNavigation<HomeNavigationProp>()
  const settingsNav = useNavigation<SettingsNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
  const spacing = useSpacing()
  const version = useAppVersion()
  const buildNumber = deviceInfo.getBuildNumber()
  const hitSlop = useHitSlop('xxl')
  const authIntervals = useAuthIntervals()
  const {
    currentAccount,
    accounts,
    defaultAccountAddress,
    updateDefaultAccountAddress,
    signOut,
  } = useAccountStorage()
  const { explorers, current: explorer, updateExplorer } = useExplorer()
  const { changeLanguage, language } = useLanguageStorage()
  const {
    authInterval,
    currency,
    pin: appPin,
    requirePinForPayment,
    updateAuthInterval,
    updateCurrency,
    updateRequirePinForPayment,
    enableHaptic,
    updateEnableHaptic,
  } = useAppStorage()
  const { showOKAlert, showOKCancelAlert } = useAlert()
  const { updateCluster, cluster, cache } = useSolana()

  const isDefaultAccount = useMemo(
    () => defaultAccountAddress === currentAccount?.address,
    [currentAccount?.address, defaultAccountAddress],
  )

  const isPinRequired = useMemo(
    () => appPin !== undefined && appPin.status !== 'off',
    [appPin],
  )

  const onRequestClose = useCallback(() => {
    homeNav.navigate('AccountsScreen')
  }, [homeNav])

  const contentContainer = useMemo(
    () => ({
      paddingBottom: spacing.xxxl,
    }),
    [spacing.xxxl],
  )

  const keyExtractor = useCallback((item, index) => item.title + index, [])

  const renderSectionFooter = useCallback(
    ({ section: { footer } }) => footer,
    [],
  )

  const { result: hasWords } = useAsync(async () => {
    if (!currentAccount?.address) return false

    const secureAccount = await getSecureAccount(currentAccount.address)
    return !!secureAccount?.mnemonic
  }, [currentAccount?.address])

  const handleIntervalSelected = useCallback(
    async (value: ReactText) => {
      const number = typeof value === 'number' ? value : parseInt(value, 10)
      await updateAuthInterval(number)
    },
    [updateAuthInterval],
  )

  const handleResetPin = useCallback(() => {
    settingsNav.push('SettingsConfirmPin', {
      pin: appPin?.value || '',
      action: 'reset',
    })
  }, [settingsNav, appPin])

  const handlePinRequired = useCallback(
    async (value?: boolean) => {
      if (!isPinRequired && value) {
        // toggling on
        settingsNav.push('SettingsCreatePin')
      }

      if (isPinRequired && !value) {
        // toggling off, confirm pin before turning off
        settingsNav.push('SettingsConfirmPin', {
          pin: appPin?.value || '',
          action: 'remove',
        })
      }
    },
    [settingsNav, appPin, isPinRequired],
  )

  const handleSetDefaultAccount = useCallback(
    async (value?: boolean) => {
      if (!isDefaultAccount && value && currentAccount?.alias && accounts) {
        // toggling on
        const oldAccount = Object.values(accounts).find(
          (a) => a.address === defaultAccountAddress,
        )
        const decision = await showOKCancelAlert({
          title: t('settings.sections.defaultAccount.enableTitle'),
          message: t('settings.sections.defaultAccount.enableMessage', {
            aliasOld: oldAccount?.alias,
            aliasNew: currentAccount.alias,
          }),
        })
        if (decision) {
          await updateDefaultAccountAddress(currentAccount.address)
        }
      }

      if (isDefaultAccount && !value) {
        // toggling off
        await showOKAlert({
          title: t('settings.sections.defaultAccount.disableTitle'),
          message: t('settings.sections.defaultAccount.disableMessage'),
        })
      }
    },
    [
      accounts,
      currentAccount?.alias,
      currentAccount?.address,
      defaultAccountAddress,
      isDefaultAccount,
      showOKAlert,
      showOKCancelAlert,
      t,
      updateDefaultAccountAddress,
    ],
  )

  const handlePinForPayment = useCallback(
    async (value?: boolean) => {
      if (!requirePinForPayment && value) {
        // toggling on
        await updateRequirePinForPayment(value)
      }

      if (requirePinForPayment && !value) {
        // toggling off, confirm pin before turning off
        settingsNav.push('SettingsConfirmPin', {
          pin: appPin?.value || '',
          action: 'disablePaymentPin',
        })
      }
    },
    [requirePinForPayment, updateRequirePinForPayment, settingsNav, appPin],
  )

  const handleSignOut = useCallback(async () => {
    const secureAccount = await getSecureAccount(currentAccount?.address)
    if (
      !secureAccount ||
      !!currentAccount?.ledgerDevice ||
      !secureAccount?.mnemonic
    ) {
      const currentAddress = currentAccount?.address
      const savedAccountAddresses = Object.keys(accounts || {})
      const isLastAccount =
        accounts &&
        currentAddress &&
        savedAccountAddresses.length === 1 &&
        savedAccountAddresses.includes(currentAddress)
      const iCloudMessage =
        Platform.OS === 'ios'
          ? t('settings.sections.account.signOutAlert.iCloudMessage')
          : ''

      Alert.alert(
        t('settings.sections.account.signOutAlert.title', {
          alias: currentAccount?.alias,
        }),
        t(
          `settings.sections.account.signOutAlert.${
            isLastAccount ? 'bodyLastAccount' : 'body'
          }`,
          {
            alias: currentAccount?.alias,
          },
        ) + iCloudMessage,
        [
          {
            text: t('generic.cancel'),
            style: 'cancel',
          },
          {
            text: t('settings.sections.account.signOut'),
            style: 'destructive',
            onPress: async () => {
              if (isLastAccount) {
                // last account is signing out, clear all storage then nav to onboarding
                await signOut()
                rootNav.replace('OnboardingNavigator')
              } else {
                // sign out the specific account, then nav to home
                await signOut(currentAccount)
                homeNav.popToTop()
              }
            },
          },
        ],
      )
    } else {
      settingsNav.push('ConfirmSignout')
    }
  }, [accounts, currentAccount, homeNav, rootNav, settingsNav, signOut, t])

  const handleLanguageChange = useCallback(
    async (lng: string) => {
      await changeLanguage(lng)
    },
    [changeLanguage],
  )

  const handleCurrencyTypeChange = useCallback(
    async (currencyType: ReactText, _index: number) => {
      await updateCurrency(currencyType as string)
    },
    [updateCurrency],
  )

  const handleExplorerChange = useCallback(
    async (ex: ReactText, _index: number) => {
      await updateExplorer(ex as string)
    },
    [updateExplorer],
  )

  const handleSolanaClusterChange = useCallback(
    async (network: ReactText, _index: number) => {
      updateCluster(network as Cluster)
    },
    [updateCluster],
  )

  const handleUpdateAlias = useCallback(
    () => settingsNav.push('UpdateAlias'),
    [settingsNav],
  )

  const handleRevealWords = useCallback(async () => {
    const hasSecureAccount = await checkSecureAccount(
      currentAccount?.address,
      true,
    )
    if (!hasSecureAccount) return
    if (isPinRequired) {
      settingsNav.push('SettingsConfirmPin', {
        pin: appPin?.value || '',
        action: 'revealWords',
      })
    } else {
      settingsNav.push('RevealWords')
    }
  }, [appPin, currentAccount, isPinRequired, settingsNav])

  const handleRevealPrivateKey = useCallback(async () => {
    const hasSecureAccount = await checkSecureAccount(
      currentAccount?.address,
      true,
    )
    if (!hasSecureAccount) return
    if (isPinRequired) {
      settingsNav.push('SettingsConfirmPin', {
        pin: appPin?.value || '',
        action: 'revealPrivateKey',
      })
    } else {
      settingsNav.push('RevealPrivateKey')
    }
  }, [appPin, currentAccount, isPinRequired, settingsNav])

  const handleShareAddress = useCallback(() => {
    settingsNav.navigate('ShareAddress')
  }, [settingsNav])

  const handlePressAutoGasManager = useCallback(() => {
    settingsNav.navigate('AutoGasManager')
  }, [settingsNav])

  const handleMigrateWallet = useCallback(() => {
    settingsNav.navigate('MigrateWallet')
  }, [settingsNav])

  const SectionData = useMemo((): {
    title: string
    data: SettingsListItemType[]
  }[] => {
    let pin: SettingsListItemType[] = [
      {
        title: t('settings.sections.security.enablePin'),
        onToggle: handlePinRequired,
        value: isPinRequired,
      },
    ]

    if (isPinRequired) {
      pin = [
        ...pin,
        {
          title: t('settings.sections.security.requirePin'),
          value: authInterval,
          select: {
            items: authIntervals,
            onValueSelect: handleIntervalSelected,
          },
        },
        {
          title: t('settings.sections.security.resetPin'),
          onPress: handleResetPin,
        },
        {
          title: t('settings.sections.security.requirePinForPayments'),
          onToggle: handlePinForPayment,
          value: requirePinForPayment,
        },
      ]
    }

    let devData: SettingsListItemType[] = []

    const items = [
      { label: 'Devnet', value: 'devnet' },
      {
        label: 'Mainnet-Beta',
        value: 'mainnet-beta',
      },
    ]

    devData = [
      ...devData,
      {
        title: t('settings.sections.dev.solanaCluster.title'),
        value: cluster,
        select: {
          items,
          onValueSelect: handleSolanaClusterChange,
        },
      },
      {
        title: t('settings.sections.dev.clearCache'),
        onPress: () => {
          Alert.alert(
            t('settings.sections.dev.clearCache'),
            t('settings.sections.dev.clearCacheMessage'),
            [
              { text: t('generic.cancel'), style: 'cancel' },
              {
                text: t('generic.clear'),
                style: 'destructive',
                onPress: async () => {
                  await persistor.purge()
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  Object.keys(cache?.genericCache.cache).forEach((key) => {
                    cache?.delete(key)
                  })
                },
              },
            ],
          )
        },
      },
    ]

    const accountSettings = [
      {
        label: t('settings.sections.account.alias'),
        title: currentAccount?.alias || '',
        onPress: handleUpdateAlias,
      },
      {
        title: t('settings.sections.defaultAccount.title'),
        onToggle: handleSetDefaultAccount,
        value: isDefaultAccount,
      },
      {
        title: t('settings.sections.account.shareAddress'),
        onPress: handleShareAddress,
      },
    ] as {
      title: string
      onPress?: () => void
      destructive?: boolean
    }[]

    accountSettings.push({
      title: t('settings.sections.account.migrateWallet'),
      onPress: handleMigrateWallet,
    })

    accountSettings.push({
      title: t('settings.sections.account.signOut'),
      onPress: handleSignOut,
      destructive: true,
    })

    return [
      {
        title: t('settings.sections.account.title', {
          alias: currentAccount?.alias,
        }),
        data: accountSettings,
      },
      {
        title: t('settings.sections.backup.title', {
          alias: currentAccount?.alias,
        }),
        data: [
          hasWords
            ? {
                title: t('settings.sections.backup.revealWords'),
                onPress: handleRevealWords,
              }
            : undefined,
          {
            title: t('settings.sections.backup.revealPrivateKey'),
            onPress: handleRevealPrivateKey,
          },
        ].filter(truthy),
      },
      {
        title: t('settings.sections.security.title'),
        data: pin,
      },
      {
        title: t('settings.sections.app.title'),
        data: [
          {
            title: t('settings.sections.app.language'),
            value: language,
            select: {
              items: SUPPORTED_LANGUAGUES,
              onValueSelect: handleLanguageChange,
            },
          },
          {
            title: t('settings.sections.app.currency'),
            value: currency,
            select: {
              items: Object.keys(SUPPORTED_CURRENCIES).map((p) => {
                return {
                  label: `${p} ${SUPPORTED_CURRENCIES[p]}`,
                  labelShort: p,
                  value: p,
                }
              }),
              onValueSelect: handleCurrencyTypeChange,
            },
          },
          {
            title: t('settings.sections.app.explorer'),
            value: explorer?.value,
            select: {
              onValueSelect: handleExplorerChange,
              items:
                explorers?.map((ex) => ({
                  ...ex,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  Icon: ({ ...props }: any) => {
                    if (ex.image.endsWith('svg')) {
                      return <SvgUri {...props} uri={ex.image} />
                    }
                    return <ImageBox {...props} source={{ uri: ex.image }} />
                  },
                })) || [],
            },
          },
          {
            title: t('settings.sections.app.enableHaptic'),
            onToggle: updateEnableHaptic,
            value: enableHaptic,
          },
          {
            title: t('settings.sections.app.autoGasManager'),
            onPress: handlePressAutoGasManager,
          },
          {
            title: t('settings.sections.app.version'),
            staticText: true,
            value: `v${version} (${buildNumber})`,
          },
        ] as SettingsListItemType[],
      },

      {
        title: t('settings.sections.dev.title'),
        data: devData,
      },
      {
        title: t('settings.sections.finePrint.title'),
        data: [
          {
            title: t('settings.sections.finePrint.privacyPolicy'),
            onPress: () => Linking.openURL(PRIVACY_POLICY),
          },
          {
            title: t('settings.sections.finePrint.termsOfService'),
            onPress: () => Linking.openURL(TERMS_OF_SERVICE),
          },
        ],
      },
    ]
  }, [
    t,
    handlePinRequired,
    isPinRequired,
    cluster,
    handleSolanaClusterChange,
    currentAccount?.alias,
    handleUpdateAlias,
    handleSetDefaultAccount,
    isDefaultAccount,
    handleShareAddress,
    handleMigrateWallet,
    handleSignOut,
    hasWords,
    handleRevealWords,
    handleRevealPrivateKey,
    language,
    handleLanguageChange,
    currency,
    handleCurrencyTypeChange,
    explorer?.value,
    handleExplorerChange,
    explorers,
    updateEnableHaptic,
    enableHaptic,
    handlePressAutoGasManager,
    version,
    buildNumber,
    authInterval,
    authIntervals,
    handleIntervalSelected,
    handleResetPin,
    handlePinForPayment,
    requirePinForPayment,
    cache,
  ])

  const renderItem = useCallback(
    ({ item, index }) => <SettingsListItem item={item} isTop={index === 0} />,
    [],
  )

  const renderSectionHeader = useCallback(
    ({ section: { title, icon } }) => (
      <Box
        flexDirection="row"
        alignItems="center"
        paddingTop="xxl"
        paddingBottom="m"
        paddingHorizontal="l"
      >
        {icon !== undefined && icon}
        <Text variant="body2" fontWeight="bold">
          {title}
        </Text>
      </Box>
    ),
    [],
  )

  return (
    <SafeAreaBox backgroundColor="surfaceSecondary">
      <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        paddingHorizontal="l"
      >
        <Text variant="h1">{t('settings.title')}</Text>
        <CloseButton
          onPress={onRequestClose}
          hitSlop={hitSlop}
          paddingVertical="m"
        />
      </Box>
      <SectionList
        contentContainerStyle={contentContainer}
        sections={SectionData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        initialNumToRender={100}
        stickySectionHeadersEnabled={false}
        // ^ Sometimes on initial page load there is a bug with SectionList
        // where it won't render all items right away. This seems to fix it.
      />
    </SafeAreaBox>
  )
}

export default memo(Settings)
