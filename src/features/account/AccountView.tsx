import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DC from '@assets/images/dc.svg'
import Helium from '@assets/images/helium.svg'
import { LayoutChangeEvent } from 'react-native'
import { NetTypes as NetType } from '@helium/address'
import { ResponsiveValue } from '@shopify/restyle'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { useColors } from '../../theme/themeHooks'
import FabButton from '../../components/FabButton'
import { AccountData, useFeatureFlagsQuery } from '../../generated/graphql'
import {
  balanceToString,
  useAccountBalances,
  useBalance,
} from '../../utils/Balance'
import { useAppStorage } from '../../storage/AppStorageProvider'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { Spacing, Theme } from '../../theme/theme'
import { useAccountStorage } from '../../storage/AccountStorageProvider'

export type Action =
  | 'send'
  | 'payment'
  | 'request'
  | 'stake'
  | 'lock'
  | 'vote'
  | '5G'
type Props = {
  accountData: AccountData | null | undefined
  visible: boolean
  onLayout?: (layout: LayoutChangeEvent) => void
  onActionSelected: (type: Action) => void
  netType: number
}
const AccountView = ({
  accountData,
  visible: _visible,
  onLayout,
  onActionSelected,
  netType,
}: Props) => {
  const { t } = useTranslation()
  const colors = useColors()

  const displayVals = useAccountBalances(accountData)
  const [balanceString, setBalanceString] = useState('')
  const { toPreferredCurrencyString } = useBalance()
  const { toggleConvertToCurrency } = useAppStorage()
  const { currentAccount } = useAccountStorage()

  const { data: featureFlagData } = useFeatureFlagsQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'network-only',
    skip: !currentAccount?.address,
  })

  const handleAction = useCallback(
    (type: Action) => () => {
      onActionSelected(type)
    },
    [onActionSelected],
  )

  useEffect(() => {
    toPreferredCurrencyString(displayVals?.hnt, { maxDecimalPlaces: 2 }).then(
      setBalanceString,
    )
  }, [displayVals, toPreferredCurrencyString])

  const buttonsTopMargin = useMemo(
    (): ResponsiveValue<Spacing, Theme> => ({
      smallPhone: 'l',
      phone: 'xxl',
    }),
    [],
  )

  return (
    <Box
      paddingHorizontal="lx"
      marginHorizontal="xs"
      paddingTop="l"
      onLayout={onLayout}
    >
      <Box
        flexDirection="row"
        alignItems="center"
        marginHorizontal="xxs"
        marginTop="l"
        marginBottom="s"
      >
        <Box
          flexDirection="row"
          alignItems="center"
          visible={netType === NetType.TESTNET}
        >
          <Text variant="body3" color="red500">
            {t('generic.testnet')}
          </Text>
        </Box>
        <Text
          variant="body3"
          color={netType === NetType.TESTNET ? 'red500' : 'grey800'}
          marginLeft="xs"
        >
          {t('accountView.balance')}
        </Text>
      </Box>
      <TouchableOpacityBox onPress={toggleConvertToCurrency}>
        <Text
          variant="h0"
          color="primaryText"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {balanceString || ' '}
        </Text>
      </TouchableOpacityBox>
      <Box flexDirection="row" marginTop="s">
        {displayVals?.stakedHnt && displayVals.stakedHnt.integerBalance > 0 && (
          <Box
            borderRadius="xl"
            overflow="hidden"
            backgroundColor={
              netType === NetType.TESTNET ? 'lividBrown' : 'surfaceSecondary'
            }
            flexDirection="row"
            alignItems="center"
            paddingVertical="sx"
            marginRight="ms"
            paddingHorizontal="ms"
          >
            <Helium color={colors.blueBright500} />
            <Text variant="body2" marginLeft="sx">
              {balanceToString(displayVals?.stakedHnt, {
                maxDecimalPlaces: 2,
                showTicker: false,
              })}
            </Text>
          </Box>
        )}
        {displayVals?.dc && displayVals.dc.integerBalance > 0 && (
          <Box
            borderRadius="xl"
            overflow="hidden"
            backgroundColor={
              netType === NetType.TESTNET ? 'lividBrown' : 'surfaceSecondary'
            }
            flexDirection="row"
            alignItems="center"
            paddingVertical="sx"
            marginRight="ms"
            paddingHorizontal="ms"
          >
            <DC />
            <Text variant="body2" marginLeft="sx">
              {balanceToString(displayVals?.dc, {
                maxDecimalPlaces: 2,
                showTicker: false,
              })}
            </Text>
          </Box>
        )}
        {displayVals?.hst && displayVals.hst.integerBalance > 0 && (
          <Box
            borderRadius="xl"
            overflow="hidden"
            backgroundColor={
              netType === NetType.TESTNET ? 'lividBrown' : 'surfaceSecondary'
            }
            flexDirection="row"
            alignItems="center"
            paddingVertical="sx"
            paddingHorizontal="ms"
          >
            <Helium color={colors.purple500} />
            <Text variant="body2" marginLeft="sx">
              {balanceToString(displayVals?.hst, {
                maxDecimalPlaces: 2,
                showTicker: false,
              })}
            </Text>
          </Box>
        )}
      </Box>

      <Box
        flexDirection="row"
        justifyContent="flex-start"
        marginTop={buttonsTopMargin}
        marginBottom="l"
      >
        <FabButton
          icon="fatArrowUp"
          backgroundColor="blueBright500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="blueBright500"
          title={t('accountView.send')}
          onPress={handleAction('send')}
        />
        <FabButton
          icon="payment"
          marginLeft="s"
          titleMarginLeft="s"
          visible={!!featureFlagData?.featureFlags?.mobileEnabled}
          backgroundColor="orange500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="orange500"
          title={t('accountView.fiveG')}
          onPress={handleAction('5G')}
        />
        <FabButton
          icon="payment"
          marginLeft="s"
          titleMarginLeft="s"
          visible={false}
          backgroundColor="orange500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="orange500"
          title={t('accountView.payment')}
          onPress={handleAction('payment')}
        />
        <FabButton
          icon="vote"
          marginLeft="s"
          titleMarginLeft="s"
          // only show for mainnet
          visible={currentAccount?.netType === NetType.MAINNET}
          backgroundColor="orange500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="orange500"
          title={t('accountView.vote')}
          onPress={handleAction('vote')}
        />
        <FabButton
          icon="fatArrowDown"
          marginLeft="s"
          titleMarginLeft="s"
          backgroundColor="greenBright500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="greenBright500"
          title={t('accountView.request')}
          onPress={handleAction('request')}
        />
        <FabButton
          icon="stake"
          marginLeft="s"
          titleMarginLeft="s"
          visible={false}
          backgroundColor="purple500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="purple500"
          title={t('accountView.stake')}
          onPress={handleAction('stake')}
        />
        <FabButton
          icon="lock"
          marginLeft="s"
          titleMarginLeft="s"
          visible={false}
          backgroundColor="red500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="red500"
          title={t('accountView.lock')}
          onPress={handleAction('lock')}
        />
      </Box>
    </Box>
  )
}

export default memo(AccountView)
