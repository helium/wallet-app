import { useNavigation } from '@react-navigation/native'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Ledger from '@assets/images/ledger.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import ButtonPressable from '@components/ButtonPressable'
import { useColors } from '@theme/themeHooks'
import { LedgerNavigatorNavigationProp } from './ledgerNavigatorTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { HomeNavigationProp } from '../home/homeTypes'

const PairSuccess = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<LedgerNavigatorNavigationProp>()
  const homeNav = useNavigation<HomeNavigationProp>()
  const { primaryText } = useColors()
  const { hasAccounts } = useAccountStorage()

  const next = useCallback(() => {
    if (hasAccounts) {
      homeNav.navigate('AccountsScreen')
    } else {
      navigation.navigate('DeviceScan')
    }
  }, [hasAccounts, homeNav, navigation])

  return (
    <Box
      flex={1}
      backgroundColor="primaryBackground"
      marginTop="l"
      paddingHorizontal="l"
    >
      <Box flex={1} justifyContent="center">
        <Box alignItems="center">
          <Ledger width={62} height={62} color={primaryText} />
          <Text variant="h1" marginVertical="l">
            {t('ledger.success.title')}
          </Text>
          <Text variant="subtitle1" color="secondaryText" textAlign="center">
            {t('ledger.success.subtitle')}
          </Text>
        </Box>
      </Box>
      <ButtonPressable
        borderRadius="round"
        backgroundColor="blueBright500"
        backgroundColorOpacityPressed={0.8}
        onPress={next}
        title={t('ledger.success.next')}
        titleColor="black900"
        marginBottom="m"
      />
    </Box>
  )
}

export default PairSuccess
