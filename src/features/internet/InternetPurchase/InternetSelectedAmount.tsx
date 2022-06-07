import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '../../../components/Box'
import Text from '../../../components/Text'
import TouchableOpacityBox from '../../../components/TouchableOpacityBox'
import { useHitSlop } from '../../../theme/themeHooks'

type Props = {
  amount: number
  onChange: () => void
  disabled: boolean
  visible: boolean
}
const InternetSelectedAmount = ({
  amount,
  onChange,
  disabled,
  visible,
}: Props) => {
  const { t } = useTranslation()
  const hitSlop = useHitSlop('xl')

  if (!visible) return null

  return (
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
        {t('internet.youArePurchasing')}
      </Text>
      <Box
        backgroundColor="surfaceSecondary"
        borderRadius="l"
        padding="m"
        marginVertical="m"
      >
        <Text variant="h1" color="primaryText" maxFontSizeMultiplier={1}>
          {`${amount}GB`}
        </Text>
      </Box>
      <TouchableOpacityBox
        onPress={onChange}
        hitSlop={hitSlop}
        disabled={disabled}
      >
        <Text variant="body1" color="secondaryText">
          {t('internet.change')}
        </Text>
      </TouchableOpacityBox>
    </Box>
  )
}

export default memo(InternetSelectedAmount)
