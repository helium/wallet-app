import React, { memo, ReactText, useMemo } from 'react'
import { Linking, Platform, Switch } from 'react-native'
import CarotRight from '@assets/images/carot-right.svg'
import LinkImg from '@assets/images/link.svg'
import { HeliumActionSheetItemType } from '../../components/HeliumActionSheetItem'
import { useColors } from '../../theme/themeHooks'
import Text, { TextProps } from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { Color } from '../../theme/theme'
import HeliumActionSheet from '../../components/HeliumActionSheet'
import { hp } from '../../utils/layout'
import Box from '../../components/Box'

export type SelectProps = {
  onDonePress?: () => void
  onValueSelect: (value: ReactText, index: number) => void
  items: HeliumActionSheetItemType[]
}

export type SettingsListItemType = {
  title: string
  label?: string
  helperText?: string
  destructive?: boolean
  onPress?: () => void
  onToggle?: (value: boolean) => void
  renderModal?: () => void
  value?: boolean | string | number
  select?: SelectProps
  openUrl?: string
  disabled?: boolean
  staticText?: boolean
}

const SettingsListItem = ({
  item: {
    title,
    label,
    helperText,
    value,
    destructive,
    onToggle,
    onPress,
    renderModal,
    select,
    openUrl,
    disabled,
    staticText,
  },
  isTop = false,
}: {
  item: SettingsListItemType
  isTop?: boolean
}) => {
  const colors = useColors()
  const isAndroid = useMemo(() => Platform.OS === 'android', [])

  const handlePress = () => {
    if (openUrl) {
      Linking.openURL(openUrl)
    }

    if (onPress) {
      onPress()
    }
  }

  const trackColor = useMemo(
    () => ({ false: colors.grey900, true: colors.greenBright500 }),
    [colors],
  )

  const thumbColor = useMemo(() => {
    if (isAndroid) {
      return colors.primaryText
    }
    return colors.primaryBackground
  }, [colors.primaryBackground, colors.primaryText, isAndroid])

  const actionSheetTextProps = useMemo(
    () =>
      ({
        variant: 'regular',
        fontSize: 16,
        color: 'surfaceSecondaryText',
      } as TextProps),
    [],
  )

  const switchStyle = useMemo(
    () =>
      isAndroid
        ? undefined
        : {
            transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
            marginRight: -8,
          },
    [isAndroid],
  )

  let textColor: Color = 'primaryText'
  if (destructive && !disabled) textColor = 'red300'
  if (destructive && disabled) textColor = 'red400'
  if (!destructive && disabled) textColor = 'grey400'

  return (
    <TouchableOpacityBox
      flexDirection="row"
      justifyContent="space-between"
      backgroundColor="primaryBackground"
      alignItems="center"
      minHeight={56}
      paddingHorizontal="l"
      marginBottom="xxxs"
      onPress={handlePress}
      disabled={disabled || !(onPress || openUrl)}
      borderBottomColor="surfaceSecondary"
      borderBottomWidth={1}
      borderTopColor="surfaceSecondary"
      borderTopWidth={isTop ? 1 : 0}
    >
      {renderModal && renderModal()}
      <Box flexDirection="column" paddingVertical="xs">
        <Text
          variant="body3"
          color="surfaceSecondaryText"
          marginBottom="xxs"
          visible={label !== undefined}
        >
          {label}
        </Text>
        <Text variant="body1" color={textColor}>
          {title}
        </Text>
        <Text
          variant="body3"
          color="surfaceSecondaryText"
          marginBottom="xxs"
          visible={helperText !== undefined}
        >
          {helperText}
        </Text>
      </Box>
      {!onToggle && !select && onPress && (
        <CarotRight color={colors.surfaceSecondaryText} />
      )}
      {openUrl && <LinkImg color={colors.surfaceSecondaryText} />}
      {onToggle && (
        <Switch
          style={switchStyle}
          value={value as boolean}
          onValueChange={onToggle}
          trackColor={trackColor}
          thumbColor={thumbColor}
          disabled={disabled}
        />
      )}
      {select && (
        <HeliumActionSheet
          data={select.items}
          selectedValue={value as string}
          onValueSelected={select.onValueSelect}
          title={title}
          textProps={actionSheetTextProps}
          iconVariant="none"
          maxModalHeight={hp(80)}
        />
      )}
      {staticText && (
        <Text fontWeight="bold" color="surfaceSecondaryText">
          {value}
        </Text>
      )}
    </TouchableOpacityBox>
  )
}

export default memo(SettingsListItem)
