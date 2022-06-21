import React, { memo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Crowdspot from '@assets/images/crowdspot.svg'
import CrowdspotEllipsis from '@assets/images/crowdspot-ellipsis.svg'
import { NetTypes as NetType, NetTypes } from '@helium/address'
import { ActivityIndicator } from 'react-native'
import AccountButton from '../../components/AccountButton'
import { useAccountSelector } from '../../components/AccountSelector'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import AccountIcon from '../../components/AccountIcon'
import { useColors } from '../../theme/themeHooks'

type Props = {
  onLogin: () => void
  appName: string
  onCancel: () => void
  loading: boolean
}
const DappLogin = ({ onLogin, onCancel, appName, loading }: Props) => {
  const { currentAccount, setCurrentAccount, sortedMainnetAccounts } =
    useAccountStorage()
  const { t } = useTranslation()
  const { showAccountTypes } = useAccountSelector()
  const colors = useColors()

  useEffect(() => {
    if (currentAccount?.netType !== NetType.MAINNET) {
      setCurrentAccount(
        sortedMainnetAccounts.length ? sortedMainnetAccounts[0] : null,
      )
    }
  }, [currentAccount, setCurrentAccount, sortedMainnetAccounts])

  return (
    <Box flex={1}>
      <Box flex={1} />
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        marginVertical="l"
      >
        <Crowdspot height={70} width={70} />
        <Box marginHorizontal="s">
          <CrowdspotEllipsis />
        </Box>
        <AccountIcon address={currentAccount?.address} size={70} />
      </Box>
      <Text variant="h0" textAlign="center">
        {t('dappLogin.account.title', {
          name: appName,
        })}
      </Text>
      <Text
        variant="subtitle1"
        textAlign="center"
        marginVertical="l"
        color="secondaryText"
      >
        {t('dappLogin.account.subtitle', { name: appName })}
      </Text>
      <AccountButton
        title={currentAccount?.alias}
        address={currentAccount?.address}
        netType={NetType.MAINNET}
        onPress={showAccountTypes(NetTypes.MAINNET)}
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
  )
}

export default memo(DappLogin)
