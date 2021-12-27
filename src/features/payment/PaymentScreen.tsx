import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Close from '@assets/images/close.svg'
import QR from '@assets/images/qr.svg'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors, useHitSlop } from '../../theme/themeHooks'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'
import { accountCurrencyType } from '../../utils/accountUtils'

type Route = RouteProp<HomeStackParamList, 'PaymentScreen'>
const PaymentScreen = () => {
  const route = useRoute<Route>()
  const { address } = route.params
  const currencyType = accountCurrencyType(address)
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const onRequestClose = useCallback(() => {
    navigation.navigate('AccountsScreen')
  }, [navigation])
  const { primaryText } = useColors()
  const hitSlop = useHitSlop('l')

  return (
    <Box backgroundColor="primaryBackground" flex={1}>
      <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <TouchableOpacityBox
          onPress={onRequestClose}
          padding="l"
          hitSlop={hitSlop}
        >
          <QR color={primaryText} height={16} width={16} />
        </TouchableOpacityBox>
        <Text
          variant="subtitle2"
          textAlign="center"
          color="primaryText"
          maxFontSizeMultiplier={1}
        >
          {t('payment.title', { ticker: currencyType.ticker })}
        </Text>
        <TouchableOpacityBox
          onPress={onRequestClose}
          padding="l"
          hitSlop={hitSlop}
        >
          <Close color={primaryText} height={16} width={16} />
        </TouchableOpacityBox>
      </Box>
    </Box>
  )
}

export default PaymentScreen
