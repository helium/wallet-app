import React, { memo, useCallback } from 'react'
import Ledger from '@assets/images/ledger.svg'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import Box from '../../components/Box'
import { useColors } from '../../theme/themeHooks'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import BackgroundFill from '../../components/BackgroundFill'
import { HomeNavigationProp } from '../home/homeTypes'
import SafeAreaBox from '../../components/SafeAreaBox'

const PairStart = () => {
  const { primaryText } = useColors()
  const { t } = useTranslation()
  const navigation = useNavigation<HomeNavigationProp>()

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
      <TouchableOpacityBox
        borderRadius="round"
        overflow="hidden"
        minHeight={66}
        padding="m"
        justifyContent="center"
        onPress={handleStart}
        marginBottom="m"
      >
        <BackgroundFill backgroundColor="surfaceContrast" opacity={0.2} />
        <Text variant="subtitle1" textAlign="center">
          {t('ledger.pairStart.pair')}
        </Text>
      </TouchableOpacityBox>
    </SafeAreaBox>
  )
}

export default memo(PairStart)
