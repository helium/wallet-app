import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Crowdspot from '@assets/svgs/crowdspot.svg'
import AddDapp from '@assets/svgs/addDapp.svg'
import DappEllipsis from '@assets/svgs/dapp-ellipsis.svg'
import { NetTypes as NetType, NetTypes } from '@helium/address'
import { ActivityIndicator } from 'react-native'
import AccountButton from '@components/AccountButton'
import AccountSelector, {
  AccountSelectorRef,
} from '@components/AccountSelector'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import AccountIcon from '@components/AccountIcon'
import { useColors } from '@config/theme/themeHooks'

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
          marginVertical="6"
        >
          {isCrowdspot ? (
            <Crowdspot height={70} width={70} />
          ) : (
            <AddDapp color={colors.primaryText} height={70} width={70} />
          )}
          <Box marginHorizontal="2">
            <DappEllipsis />
          </Box>
          <AccountIcon address={currentAccount?.address} size={70} />
        </Box>
        <Text variant="displayLgRegular" textAlign="center">
          {t('dappLogin.account.title', {
            appName,
          })}
        </Text>
        <Text
          variant="textXlMedium"
          textAlign="center"
          marginVertical="6"
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
            marginEnd="4"
            borderRadius="full"
            overflow="hidden"
            backgroundColor="secondaryText"
            onPress={onCancel}
          >
            <Text variant="textXlMedium" textAlign="center" color="primaryText">
              {t('generic.cancel')}
            </Text>
          </TouchableOpacityBox>
          <TouchableOpacityBox
            flex={1}
            minHeight={66}
            backgroundColor="primaryBackground"
            justifyContent="center"
            alignItems="center"
            onPress={onLogin}
            borderRadius="full"
            disabled={loading}
            flexDirection="row"
          >
            {loading ? (
              <ActivityIndicator color={colors.secondaryText} />
            ) : (
              <Text
                marginLeft="2"
                variant="textXlMedium"
                textAlign="center"
                color="secondaryText"
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
