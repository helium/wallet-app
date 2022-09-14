import { BoxProps } from '@shopify/restyle'
import React, { memo, useMemo } from 'react'
import Text from '../../../components/Text'
import TouchableOpacityBox from '../../../components/TouchableOpacityBox'
import { Theme } from '../../../theme/theme'

export const PaymentOptions = ['hnt'] as const
export type PaymentOptionType = typeof PaymentOptions[number]

type Props = {
  selected: boolean
  option: PaymentOptionType
  onPress: () => void
} & BoxProps<Theme>
const InternetPaymentTab = ({
  selected,
  option,
  onPress,
  ...boxProps
}: Props) => {
  const title = useMemo(() => {
    switch (option) {
      case 'hnt':
        return 'HNT'
    }
  }, [option])

  return (
    <TouchableOpacityBox
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...boxProps}
      flexDirection="row"
      onPress={onPress}
      backgroundColor={selected ? 'black400' : 'black700'}
      borderTopLeftRadius="l"
      borderTopRightRadius="l"
      paddingHorizontal="l"
      height={54}
      alignItems="center"
    >
      <Text variant="body1">{title}</Text>
    </TouchableOpacityBox>
  )
}

export default memo(InternetPaymentTab)
