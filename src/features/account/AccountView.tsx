import Balance, { CurrencyType } from '@helium/currency'
import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import DC from '@assets/images/dc.svg'
import Helium from '@assets/images/helium.svg'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import { NetType } from '@helium/crypto-react-native'
import TestnetIcon from '@assets/images/testnetIcon.svg'
import Box from '../../components/Box'
import Surface from '../../components/Surface'
import Text from '../../components/Text'
import { useColors } from '../../theme/themeHooks'
import FabButton from '../../components/FabButton'
import { AccountData } from '../../generated/graphql'
import { accountCurrencyType } from '../../utils/accountUtils'

export type Action = 'send' | 'payment' | 'request' | 'stake' | 'lock'
type Props = {
  address: string
  accountData: AccountData | null | undefined
  visible: boolean
  onLayoutChange?: (layout: LayoutRectangle) => void
  onActionSelected: (type: Action) => void
  netType: number
}
const AccountView = ({
  accountData,
  visible: _visible,
  onLayoutChange,
  onActionSelected,
  address: _address,
  netType,
}: Props) => {
  const { t } = useTranslation()
  const colors = useColors()

  const displayVals = useMemo(() => {
    if (!accountData) return
    const currencyType = accountCurrencyType(_address)

    return {
      hnt: new Balance(accountData.balance || 0, currencyType),
      dc: new Balance(accountData.dcBalance || 0, CurrencyType.dataCredit),
      stakedHnt: new Balance(accountData.stakedBalance || 0, currencyType),
      hst: new Balance(accountData.secBalance || 0, CurrencyType.security),
    }
  }, [_address, accountData])

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onLayoutChange?.(event.nativeEvent.layout)
    },
    [onLayoutChange],
  )

  const handleAction = useCallback(
    (type: Action) => () => {
      onActionSelected(type)
    },
    [onActionSelected],
  )

  return (
    <Box
      paddingHorizontal="lx"
      marginHorizontal="xs"
      paddingTop="xxl"
      onLayout={handleLayout}
    >
      <Box
        flexDirection="row"
        alignItems="center"
        marginHorizontal="xxs"
        marginBottom="s"
      >
        <Box
          flexDirection="row"
          alignItems="center"
          visible={netType === NetType.TESTNET}
        >
          <TestnetIcon height={12} color={colors.grey800} />
          <Text variant="body3" color="grey800">
            {t('onboarding.testnet')}
          </Text>
        </Box>
        <Text variant="body3" color="grey800" marginLeft="xs">
          {t('accountView.balance')}
        </Text>
      </Box>
      {/* TODO: Make this convert to their currency of choice */}
      <Text variant="h0">{displayVals?.hnt.toString(2)}</Text>
      <Box flexDirection="row" marginTop="s">
        <Surface
          flexDirection="row"
          alignItems="center"
          paddingVertical="sx"
          marginRight="ms"
          paddingHorizontal="ms"
        >
          <Helium color={colors.blueBright500} />
          <Text variant="body2" marginLeft="sx">
            {displayVals?.stakedHnt.toString(2, { showTicker: false })}
          </Text>
        </Surface>
        <Surface
          flexDirection="row"
          alignItems="center"
          paddingVertical="sx"
          marginRight="ms"
          paddingHorizontal="ms"
        >
          <DC />
          <Text variant="body2" marginLeft="sx">
            {displayVals?.hst.toString(2, { showTicker: false })}
          </Text>
        </Surface>
        <Surface
          flexDirection="row"
          alignItems="center"
          paddingVertical="sx"
          paddingHorizontal="ms"
        >
          <Helium color={colors.purple500} />
          <Text variant="body2" marginLeft="sx">
            {displayVals?.hst.toString(2, { showTicker: false })}
          </Text>
        </Surface>
      </Box>

      <Box
        flexDirection="row"
        justifyContent="space-between"
        marginTop="xxxl"
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
          backgroundColor="orange500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="orange500"
          title={t('accountView.payment')}
          onPress={handleAction('payment')}
        />
        <FabButton
          icon="fatArrowDown"
          backgroundColor="greenBright500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="greenBright500"
          title={t('accountView.request')}
          onPress={handleAction('request')}
        />
        <FabButton
          icon="stake"
          backgroundColor="purple500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="purple500"
          title={t('accountView.stake')}
          onPress={handleAction('stake')}
        />
        <FabButton
          icon="lock"
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
