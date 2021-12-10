import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import WifiLogo from '@assets/images/wifiLogo.svg'
import ChevronDown from '@assets/images/chevronDown.svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Balance, { CurrencyType } from '@helium/currency'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { useColors, useHitSlop } from '../../theme/themeHooks'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'
import SegmentedControl from '../../components/SegmentedControl'
import ButtonPressable from '../../components/ButtonPressable'
import animateTransition from '../../utils/animateTransition'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import AccountIcon from '../../components/AccountIcon'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAccountQuery, useHeliumDataQuery } from '../../generated/graphql'

type Route = RouteProp<HomeStackParamList, 'WifiPurchase'>
const WifiPurchase = () => {
  const { currentAccount } = useAccountStorage()
  const { data } = useHeliumDataQuery({
    variables: { address: currentAccount?.address },
    fetchPolicy: 'network-only',
    skip: !currentAccount?.address,
  })
  const { data: accountData } = useAccountQuery({
    variables: { address: currentAccount?.address },
    fetchPolicy: 'cache-and-network',
    skip: !currentAccount?.address,
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const route = useRoute<Route>()
  const navigation = useNavigation<HomeNavigationProp>()
  const { bottom } = useSafeAreaInsets()
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const hitSlop = useHitSlop('xl')
  const [type, setType] = useState<'data' | 'minutes'>('data')
  const [viewState, setViewState] = useState<'select' | 'confirm'>('select')
  const [dataIndex, setDataIndex] = useState(0)

  const segmentData = useMemo(
    () => [
      { id: 'data', title: t('wifi.data') },
      { id: 'minutes', title: t('wifi.minutes') },
    ],
    [t],
  )

  const bottomStyle = useMemo(
    () => ({
      paddingBottom: bottom,
    }),
    [bottom],
  )

  const accountBalance = useMemo(() => {
    if (!accountData?.account) return
    return new Balance(accountData.account.balance, CurrencyType.networkToken)
  }, [accountData])

  const onSegmentChange = useCallback((id: string) => {
    setType(id as 'data' | 'minutes')
  }, [])

  const amounts = useMemo(() => {
    // TODO: Prices are just placeholder for now
    if (type === 'data') {
      return [
        { val: 1, price: 10_000_000 },
        { val: 5, price: 50_000_000 },
        { val: 20, price: 200_000_000 },
      ]
    }
    return [
      { val: 300, price: 10_000_000 },
      { val: 600, price: 20_000_000 },
      { val: 1_000, price: 30_000_000 },
    ]
  }, [type])

  const priceBalance = useMemo(() => {
    return new Balance(amounts[dataIndex].price, CurrencyType.dataCredit)
  }, [amounts, dataIndex])

  const handleAmountChange = useCallback(
    (index: number) => () => {
      setDataIndex(index)
    },
    [],
  )

  const handleCancel = useCallback(() => navigation.goBack(), [navigation])

  const handleViewStateChange = useCallback(
    (val: 'select' | 'confirm') => () => {
      animateTransition('WifiPurchase.handleNext')
      setViewState(val)
    },
    [],
  )

  const oraclePrice = useMemo(() => {
    if (!data?.currentOraclePrice?.price) return

    return new Balance(data.currentOraclePrice.price, CurrencyType.usd)
  }, [data])

  return (
    <Box flex={1} alignItems="center" paddingTop="l">
      <WifiLogo color={primaryText} />

      {viewState === 'select' && (
        <Box
          justifyContent="center"
          flex={1}
          width="100%"
          alignItems="center"
          paddingHorizontal="xl"
        >
          {/* TODO: Make segmented control style more configurable */}
          <SegmentedControl
            width={260}
            onChange={onSegmentChange}
            padding="ms"
            selectedId={type}
            values={segmentData}
          />

          <Text
            marginTop="l"
            variant="h3"
            textAlign="center"
            color="primaryText"
            maxFontSizeMultiplier={1}
          >
            {t('wifi.howMuch')}
          </Text>
          <Box flexDirection="row" marginTop="l">
            {amounts.map((a, index) => {
              const title = `${a.val}${type === 'data' ? 'GB' : ''}`

              return (
                <ButtonPressable
                  title={title}
                  key={a.val}
                  height={58}
                  flex={1}
                  backgroundColor="primaryBackground"
                  backgroundColorPressed="surfaceSecondary"
                  borderRadius="l"
                  selected={index === dataIndex}
                  marginRight={index !== amounts.length - 1 ? 's' : 'none'}
                  onPress={handleAmountChange(index)}
                />
              )
            })}
          </Box>
        </Box>
      )}
      {viewState === 'confirm' && (
        <Box
          justifyContent="center"
          flex={1}
          width="100%"
          alignItems="center"
          paddingHorizontal="xl"
        >
          <Text
            marginTop="l"
            variant="subtitle2"
            textAlign="center"
            color="primaryText"
            maxFontSizeMultiplier={1}
          >
            {t('wifi.youArePurchasing')}
          </Text>
          <Box
            backgroundColor="surfaceSecondary"
            borderRadius="l"
            padding="m"
            marginVertical="m"
          >
            <Text variant="h1" color="primaryText" maxFontSizeMultiplier={1}>
              {`${amounts[dataIndex].val}${type === 'data' ? 'GB' : ''}`}
            </Text>
          </Box>
          <TouchableOpacityBox
            onPress={handleViewStateChange('select')}
            hitSlop={hitSlop}
          >
            <Text variant="body1" color="secondaryText">
              {t('wifi.change')}
            </Text>
          </TouchableOpacityBox>
        </Box>
      )}
      <Box
        style={bottomStyle}
        width="100%"
        backgroundColor="surfaceSecondary"
        borderTopLeftRadius="xl"
        borderTopRightRadius="xl"
      >
        {viewState === 'confirm' && (
          <Box
            paddingHorizontal="xl"
            paddingVertical="l"
            borderBottomColor="primaryBackground"
            borderBottomWidth={1}
            flexDirection="row"
            alignItems="center"
          >
            <AccountIcon size={26} address={currentAccount?.address} />
            <Text marginLeft="ms" variant="subtitle2" flex={1}>
              {currentAccount?.alias}
            </Text>
            <TouchableOpacityBox hitSlop={hitSlop}>
              <ChevronDown />
            </TouchableOpacityBox>
          </Box>
        )}
        <Box paddingVertical="l" paddingHorizontal="xl">
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Text variant="body1" color="primaryText">
              {t('generic.total')}
            </Text>
            <Text variant="body1" color="primaryText" fontSize={25}>
              {/* TODO: Convert to locale currency */}
              {priceBalance.toUsd(oraclePrice).toString(2)}
            </Text>
          </Box>
          <Text variant="body1" color="secondaryText" alignSelf="flex-end">
            {oraclePrice
              ? priceBalance.toNetworkTokens(oraclePrice).toString(4)
              : ''}
          </Text>
        </Box>
        {viewState === 'confirm' && (
          <Box
            paddingHorizontal="xl"
            paddingVertical="l"
            borderTopColor="primaryBackground"
            borderTopWidth={1}
          >
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Text variant="body1" color="primaryText">
                {t('wifi.remainingBalance')}
              </Text>
              <Text variant="body1" color="primaryText" fontSize={25}>
                {accountBalance?.toString(3)}
              </Text>
            </Box>
            <Text variant="body1" color="secondaryText" alignSelf="flex-end">
              {/* TODO: Convert to locale currency */}
              {accountBalance?.toUsd(oraclePrice).toString(2)}
            </Text>
          </Box>
        )}
        <Box flexDirection="row" paddingHorizontal="xl">
          <ButtonPressable
            title={t('generic.cancel')}
            flex={viewState === 'confirm' ? undefined : 1}
            backgroundColor="surface"
            backgroundColorPressed="surfaceContrast"
            backgroundColorOpacityPressed={0.08}
            borderRadius="round"
            marginRight="s"
            padding="m"
            onPress={handleCancel}
          />
          <ButtonPressable
            padding="m"
            title={
              viewState === 'confirm'
                ? t('wifi.confirmPayment')
                : t('generic.next')
            }
            flex={1}
            backgroundColor="surfaceContrast"
            titleColor="surfaceContrastText"
            backgroundColorPressed="surface"
            titleColorPressed="surfaceText"
            backgroundColorOpacityPressed={0.08}
            borderRadius="round"
            marginLeft="s"
            onPress={handleViewStateChange('confirm')}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default WifiPurchase
