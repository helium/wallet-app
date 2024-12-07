import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Ledger from '@assets/svgs/ledger.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import { useColors } from '@config/theme/themeHooks'
import { useBottomSheet } from '@gorhom/bottom-sheet'
import CheckButton from '@components/CheckButton'

const PairSuccess = () => {
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const { close } = useBottomSheet()

  const next = useCallback(() => {
    close()
  }, [close])

  return (
    <Box flex={1} marginTop="6" paddingHorizontal="6">
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
      <CheckButton onPress={next} />
    </Box>
  )
}

export default PairSuccess
