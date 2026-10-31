import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import sleep from '@utils/sleep'
import { ChevronRight, Link } from 'lucide-react-native'
import React, { useRef } from 'react'
import { Linking, Platform, Switch, View } from 'react-native'
import { withUniwind } from 'uniwind'
import SettingsSelectSheet, { SelectItem } from './SettingsSelectSheet'

const ChevronIcon = withUniwind(ChevronRight)
const LinkIcon = withUniwind(Link)

export type SelectProps = {
  onDonePress?: () => void
  onValueSelect: (value: string | number, index: number) => void | Promise<void>
  items: SelectItem[]
}

export type SettingsListItemType = {
  title: string
  label?: string
  helperText?: string
  destructive?: boolean
  onPress?: () => void | Promise<void>
  onToggle?: (value: boolean) => void | Promise<void>
  renderModal?: () => React.ReactNode
  value?: boolean | string | number
  select?: SelectProps
  openUrl?: string
  disabled?: boolean
  staticText?: boolean
  testID?: string
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
    testID,
  },
  isTop = false,
}: {
  item: SettingsListItemType
  isTop?: boolean
}) => {
  const sheetRef = useRef<BottomSheetModal>(null)
  const isAndroid = Platform.OS === 'android'

  const handlePress = () => {
    if (openUrl) {
      void Linking.openURL(openUrl)
    }

    if (onPress) {
      void onPress()
    }

    if (select) {
      sheetRef.current?.present()
    }
  }

  const selectedItem = select?.items.find((i) => i.value === value)
  const selectedLabel = selectedItem?.labelShort || selectedItem?.label

  let textClassName = 'text-foreground'
  if (destructive && !disabled) textClassName = 'text-destructive'
  if (destructive && disabled) textClassName = 'text-destructive/60'
  if (!destructive && disabled) textClassName = 'text-muted-foreground'

  const handleSelect = async (
    itemValue: string | number,
    itemIndex: number,
  ) => {
    // Need to wait a little bit to avoid a glitch with the animation
    await sleep(100)

    void select?.onValueSelect(itemValue, itemIndex)
  }

  return (
    <PressableScale
      testID={testID}
      feedback="opacity"
      onPress={handlePress}
      disabled={disabled || !(onPress || openUrl || select)}
      className={twMerge(
        'mb-px min-h-14 flex-row items-center justify-between border-b border-border px-6',
        isTop && 'border-t',
      )}
    >
      {renderModal && renderModal()}
      <View className="flex-col py-1">
        {label !== undefined && (
          <Text size="xs" className="mb-0.5 text-muted-foreground">
            {label}
          </Text>
        )}
        <Text size="base" className={textClassName}>
          {title}
        </Text>
        {helperText !== undefined && (
          <Text size="xs" className="mb-0.5 text-muted-foreground">
            {helperText}
          </Text>
        )}
      </View>
      {!onToggle && !select && onPress && (
        <ChevronIcon size={16} colorClassName="accent-muted-foreground" />
      )}
      {openUrl && (
        <LinkIcon size={16} colorClassName="accent-muted-foreground" />
      )}
      {onToggle && (
        <Switch
          style={
            isAndroid
              ? undefined
              : {
                  transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
                  marginRight: -8,
                }
          }
          value={value as boolean}
          onValueChange={onToggle}
          trackColorOnClassName="accent-purple-500"
          trackColorOffClassName="accent-secondary"
          thumbColorClassName="accent-white"
          disabled={disabled}
        />
      )}
      {!!selectedLabel && (
        <Text size="base" className="font-bold text-muted-foreground">
          {selectedLabel}
        </Text>
      )}
      {select && (
        <SettingsSelectSheet
          ref={sheetRef}
          title={title}
          items={select.items}
          selectedValue={value as string}
          onValueSelected={(itemValue, itemIndex) =>
            void handleSelect(itemValue, itemIndex).catch(console.error)
          }
        />
      )}
      {staticText && (
        <Text className="font-bold text-muted-foreground">{value}</Text>
      )}
    </PressableScale>
  )
}

export default SettingsListItem
