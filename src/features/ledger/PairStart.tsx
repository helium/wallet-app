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
      marginHorizontal="6"
      edges={['bottom']}
    >
      <Box flex={1} justifyContent="center">
        <Box alignItems="center">
          <Ledger color={primaryText} height={61} width={61} />
          <Text
            variant="displayLgRegular"
            textAlign="center"
            marginVertical="6"
            color="primaryText"
          >
            {t('ledger.pairStart.title')}
          </Text>
          <Text variant="textXlMedium" textAlign="center" color="secondaryText">
            {t('ledger.pairStart.subtitle')}
          </Text>
        </Box>
      </Box>
      <Text
        visible={reachedAccountLimit}
        variant="textMdRegular"
        textAlign="center"
        marginHorizontal="6"
        color="ros.500"
        fontWeight="500"
        marginBottom="6"
      >
        {t('accountImport.accountLimit')}
      </Text>
      <ButtonPressable
        disabled={reachedAccountLimit}
        borderRadius="full"
        onPress={handleStart}
        backgroundColor="primaryText"
        backgroundColorOpacityPressed={0.7}
        backgroundColorDisabled="bg.tertiary"
        backgroundColorDisabledOpacity={0.5}
        titleColorDisabled="gray.800"
        titleColor="primaryBackground"
        fontWeight="500"
        title={t('ledger.pairStart.pair')}
        marginBottom="6"
      />
    </SafeAreaBox>
  )
}

export default memo(PairStart)
