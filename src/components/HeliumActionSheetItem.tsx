import React, { memo, useMemo } from 'react'
import { SvgProps } from 'react-native-svg'
import { Color } from '@config/theme/theme'
import { useColors } from '@config/theme/themeHooks'
import Text from './Text'
import TouchableOpacityBox from './TouchableOpacityBox'

export type HeliumActionSheetItemType = {
  label: string
  labelShort?: string
  value: string | number
  Icon?: React.FC<SvgProps>
  action?: () => void
  disabled?: boolean
}
type Props = HeliumActionSheetItemType & {
  onPress: () => void
  selected: boolean
}

export const HeliumActionSheetItemHeight = 50

const HeliumActionSheetItem = ({
  label,
  onPress,
  selected,
  disabled,
  Icon,
  labelShort: _labelShort,
  value: _value,
  action: _action,
}: Props) => {
  const colors = useColors()

  const color = useMemo((): Color => {
    if (selected) return 'purple.500'
    if (disabled) return 'secondaryText'
    return 'secondaryText'
  }, [disabled, selected])

  return (
    <TouchableOpacityBox
      height={HeliumActionSheetItemHeight}
      onPress={onPress}
      alignItems="center"
      flexDirection="row"
      disabled={disabled}
    >
      {!!Icon && <Icon color={colors[color]} height={16} width={16} />}
      <Text
        variant="textSmRegular"
        marginLeft={Icon ? '3' : 'none'}
        color={color}
        fontWeight={selected ? '500' : 'normal'}
        fontSize={18}
        maxFontSizeMultiplier={1.2}
      >
        {label}
      </Text>
    </TouchableOpacityBox>
  )
}

export default memo(HeliumActionSheetItem)
