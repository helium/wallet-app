import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Crowdspot from '@assets/images/crowdspot.svg'
import AddDapp from '@assets/images/addDapp.svg'
import DappEllipsis from '@assets/images/dapp-ellipsis.svg'
import { NetTypes as NetType, NetTypes } from '@helium/address'
import { ActivityIndicator } from 'react-native'
import AccountButton from '@components/AccountButton'
import AccountSelector, {
  AccountSelectorRef,
} from '@components/AccountSelector'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import AccountIcon from '@components/AccountIcon'
import { useColors } from '@theme/themeHooks'

type Props = {
  onLogin: () => void
  appName: string
  onCancel: () => void
  loading: boolean
}
const DappLogin = ({ onLogin, onCancel, appName, loading }: Props) => {
  const {
    currentAccount,
    setCurrentAccount,
    sortedMainnetAccounts,
    currentNetworkAddress,
  } = useAccountStorage()
  const { t } = useTranslation()
  const accountSelectorRef = useRef<AccountSelectorRef>(null)
  const colors = useColors()

  const isCrowdspot = useMemo(
    () => appName.toLowerCase() === 'crowdspot',
    [appName],
  )

  const handleAccountButtonPress = useCallback(() => {
    if (!accountSelectorRef?.current) return

    accountSelectorRef.current.showAccountTypes(NetTypes.MAINNET)()
  }, [])

  useEffect(() => {
    if (currentAccount?.netType !== NetType.MAINNET) {
      setCurrentAccount(
        sortedMainnetAccounts.length ? sortedMainnetAccounts[0] : null,
      )
    }
  }, [currentAccount, setCurrentAccount, sortedMainnetAccounts])

  return (
    <AccountSelector ref={accountSelectorRef}>
      <Box flex={1}>
        <Box flex={1} />
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          marginVertical="l"
        >
          {isCrowdspot ? (
            <Crowdspot height={70} width={70} />
          ) : (
            <AddDapp color={colors.primaryText} height={70} width={70} />
          )}
          <Box marginHorizontal="s">
            <DappEllipsis />
          </Box>
          <AccountIcon address={currentAccount?.address} size={70} />
        </Box>
        <Text variant="h0" textAlign="center">
          {t('dappLogin.account.title', {
            appName,
          })}
        </Text>
        <Text
          variant="subtitle1"
          textAlign="center"
          marginVertical="l"
          color="secondaryText"
        >
          {t('dappLogin.account.subtitle', { appName })}
        </Text>
        <AccountButton
          title={currentAccount?.alias}
          address={currentNetworkAddress}
          onPress={handleAccountButtonPress}
        />
        <Box flex={1.5} />
        <Box flexDirection="row">
          <TouchableOpacityBox
            flex={1}
            minHeight={66}
            justifyContent="center"
            marginEnd="m"
            borderRadius="round"
            overflow="hidden"
            backgroundColor="secondaryIcon"
            onPress={onCancel}
          >
            <Text variant="subtitle1" textAlign="center" color="primaryText">
              {t('generic.cancel')}
            </Text>
          </TouchableOpacityBox>
          <TouchableOpacityBox
            flex={1}
            minHeight={66}
            backgroundColor="surfaceContrast"
            justifyContent="center"
            alignItems="center"
            onPress={onLogin}
            borderRadius="round"
            disabled={loading}
            flexDirection="row"
          >
            {loading ? (
              <ActivityIndicator color={colors.surfaceContrastText} />
            ) : (
              <Text
                marginLeft="s"
                variant="subtitle1"
                textAlign="center"
                color="secondary"
              >
                {t('dappLogin.login')}
              </Text>
            )}
          </TouchableOpacityBox>
        </Box>
      </Box>
    </AccountSelector>
  )
}

export default memo(DappLogin)
