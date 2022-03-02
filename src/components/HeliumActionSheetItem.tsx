import React, { memo } from 'react'
import { SvgProps } from 'react-native-svg'
import { useColors } from '../theme/themeHooks'
import Text from './Text'
import TouchableOpacityBox from './TouchableOpacityBox'

export type HeliumActionSheetItemType = {
  label: string
  labelShort?: string
  value: string | number
  Icon?: React.FC<SvgProps>
  action?: () => void
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
  Icon,
  labelShort: _labelShort,
  value: _value,
  action: _action,
}: Props) => {
  const { purple500, surfaceSecondaryText } = useColors()
  return (
    <TouchableOpacityBox
      height={HeliumActionSheetItemHeight}
      onPress={onPress}
      alignItems="center"
      flexDirection="row"
    >
      {!!Icon && (
        <Icon
          color={selected ? purple500 : surfaceSecondaryText}
          height={16}
          width={16}
        />
      )}
      <Text
        marginLeft={Icon ? 'ms' : 'none'}
        color={selected ? 'purple500' : 'surfaceSecondaryText'}
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
