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
import { RootNavigationProp } from '../../navigation/rootTypes'

const PairSuccess = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<LedgerNavigatorNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
  const { primaryText } = useColors()
  const { hasAccounts } = useAccountStorage()

  const next = useCallback(() => {
    if (hasAccounts) {
      rootNav.reset({
        index: 0,
        routes: [
          {
            name: 'TabBarNavigator',
          },
        ],
      })
    } else {
      navigation.navigate('DeviceScan')
    }
  }, [hasAccounts, rootNav, navigation])

  return (
    <Box
      flex={1}
      backgroundColor="primaryBackground"
      marginTop="6"
      paddingHorizontal="6"
    >
      <Box flex={1} justifyContent="center">
        <Box alignItems="center">
          <Ledger width={62} height={62} color={primaryText} />
          <Text variant="displayMdRegular" marginVertical="6">
            {t('ledger.success.title')}
          </Text>
          <Text variant="textXlMedium" color="secondaryText" textAlign="center">
            {t('ledger.success.subtitle')}
          </Text>
        </Box>
      </Box>
      <ButtonPressable
        borderRadius="full"
        backgroundColor="blue.light-500"
        backgroundColorOpacityPressed={0.8}
        onPress={next}
        title={t('ledger.success.next')}
        titleColor="base.black"
        marginBottom="4"
      />
    </Box>
  )
}

export default PairSuccess
