import React, { memo, ReactText, useCallback, useMemo, useRef } from 'react'
import { Linking, Platform, Switch } from 'react-native'
import CarotRight from '@assets/svgs/carot-right.svg'
import LinkImg from '@assets/svgs/link.svg'
import { HeliumActionSheetItemType } from '@components/HeliumActionSheetItem'
import Text, { TextProps } from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { Color } from '@config/theme/theme'
import HeliumActionSheet, {
  HeliumActionSheetRef,
} from '@components/HeliumActionSheet'
import Box from '@components/Box'
import { useColors } from '@config/theme/themeHooks'
import { hp } from '@utils/layout'
import sleep from '@utils/sleep'

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
  renderModal?: () => React.ReactNode
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
  const actionSheetRef = useRef<HeliumActionSheetRef>(null)
  const colors = useColors()
  const isAndroid = useMemo(() => Platform.OS === 'android', [])

  const handlePress = () => {
    if (openUrl) {
      Linking.openURL(openUrl)
    }

    if (onPress) {
      onPress()
    }

    if (select) {
      actionSheetRef.current?.show()
    }
  }

  const trackColor = useMemo(
    () => ({ false: colors['gray.900'], true: colors['green.light-500'] }),
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
        variant: 'textMdRegular',
        fontSize: 16,
        color: 'secondaryText',
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
  if (destructive && !disabled) textColor = 'error.500'
  if (destructive && disabled) textColor = 'error.300'
  if (!destructive && disabled) textColor = 'gray.400'

  const handleSelect = useCallback(
    async (itemValue: string | number, itemIndex: number) => {
      // Need to wait a little bit to avoid a glitch with the animation
      await sleep(100)

      select?.onValueSelect(itemValue, itemIndex)
    },
    [select],
  )

  return (
    <TouchableOpacityBox
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      minHeight={56}
      paddingHorizontal="6"
      marginBottom="0.25"
      onPress={handlePress}
      disabled={disabled || !(onPress || openUrl || select)}
      borderBottomColor="border.secondary"
      borderBottomWidth={1}
      borderTopColor="border.secondary"
      borderTopWidth={isTop ? 1 : 0}
    >
      {renderModal && renderModal()}
      <Box flexDirection="column" paddingVertical="xs">
        <Text
          variant="textXsRegular"
          color="secondaryText"
          marginBottom="0.5"
          visible={label !== undefined}
        >
          {label}
        </Text>
        <Text variant="textMdRegular" color={textColor}>
          {title}
        </Text>
        <Text
          variant="textXsRegular"
          color="secondaryText"
          marginBottom="0.5"
          visible={helperText !== undefined}
        >
          {helperText}
        </Text>
      </Box>
      {!onToggle && !select && onPress && (
        <CarotRight color={colors.secondaryText} />
      )}
      {openUrl && <LinkImg color={colors.secondaryText} />}
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
          ref={actionSheetRef}
          data={select.items}
          selectedValue={value as string}
          onValueSelected={handleSelect}
          title={title}
          textProps={actionSheetTextProps}
          iconVariant="none"
          maxModalHeight={hp(80)}
        />
      )}
      {staticText && (
        <Text variant="textSmSemibold" fontWeight="bold" color="secondaryText">
          {value}
        </Text>
      )}
    </TouchableOpacityBox>
  )
}

export default memo(SettingsListItem)
