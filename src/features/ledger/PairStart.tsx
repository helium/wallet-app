import React, { memo, useCallback } from 'react'
import Ledger from '@assets/images/ledger.svg'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import Box from '@components/Box'
import { useColors } from '@theme/themeHooks'
import Text from '@components/Text'
import SafeAreaBox from '@components/SafeAreaBox'
import ButtonPressable from '@components/ButtonPressable'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { AddNewAccountNavigationProp } from '../home/addNewAccount/addNewAccountTypes'

const PairStart = () => {
  const { primaryText } = useColors()
  const { t } = useTranslation()
  const navigation = useNavigation<AddNewAccountNavigationProp>()
  const { reachedAccountLimit } = useAccountStorage()

  const handleStart = useCallback(() => {
    navigation.navigate('LedgerNavigator')
  }, [navigation])

  return (
    <SafeAreaBox
      flex={1}
      justifyContent="center"
      marginHorizontal="l"
      edges={['bottom']}
    >
      <Box flex={1} justifyContent="center">
        <Box alignItems="center">
          <Ledger color={primaryText} height={61} width={61} />
          <Text variant="h0" textAlign="center" marginVertical="l">
            {t('ledger.pairStart.title')}
          </Text>
          <Text variant="subtitle1" textAlign="center">
            {t('ledger.pairStart.subtitle')}
          </Text>
        </Box>
      </Box>
      <Text
        visible={reachedAccountLimit}
        variant="body1"
        textAlign="center"
        marginHorizontal="l"
        color="error"
        fontWeight="500"
        marginBottom="l"
      >
        {t('accountImport.accountLimit')}
      </Text>
      <ButtonPressable
        disabled={reachedAccountLimit}
        borderRadius="round"
        onPress={handleStart}
        backgroundColor="primaryText"
        backgroundColorOpacityPressed={0.7}
        backgroundColorDisabled="surfaceSecondary"
        backgroundColorDisabledOpacity={0.5}
        titleColorDisabled="black500"
        titleColor="primary"
        fontWeight="500"
        title={t('ledger.pairStart.pair')}
        marginBottom="l"
      />
    </SafeAreaBox>
  )
}

export default memo(PairStart)
