import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '../../../components/Box'
import ButtonPressable from '../../../components/ButtonPressable'
import Text from '../../../components/Text'

type Props = {
  visible: boolean
  amounts: {
    val: number
    dcPrice: number
  }[]
  selectedIndex: number
  onSelect: (index: number) => void
}
const InternetSelectDataAmount = ({
  visible,
  amounts,
  onSelect,
  selectedIndex,
}: Props) => {
  const { t } = useTranslation()

  const handleAmountChange = useCallback(
    (index: number) => () => {
      onSelect(index)
    },
    [onSelect],
  )

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
        variant="h3"
        textAlign="center"
        color="primaryText"
        maxFontSizeMultiplier={1}
      >
        {t('internet.howMuch')}
      </Text>
      <Box flexDirection="row" marginTop="l">
        {amounts.map((a, index) => {
          const title = `${a.val}GB`

          return (
            <ButtonPressable
              title={title}
              key={a.val}
              height={58}
              flex={1}
              backgroundColor="primaryBackground"
              backgroundColorPressed="surfaceSecondary"
              borderRadius="l"
              selected={index === selectedIndex}
              marginRight={index !== amounts.length - 1 ? 's' : 'none'}
              onPress={handleAmountChange(index)}
            />
          )
        })}
      </Box>
    </Box>
  )
}

export default memo(InternetSelectDataAmount)
