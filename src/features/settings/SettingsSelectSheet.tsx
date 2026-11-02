import { BottomSheetScrollView, BottomSheetModal } from '@gorhom/bottom-sheet'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Sheet } from '@ui/Sheet'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import useDisappear from '@hooks/useDisappear'
import React, { FC, useImperativeHandle, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type SelectItem = {
  label: string
  labelShort?: string
  value: string | number
  Icon?: FC<{ width: number; height: number }>
  disabled?: boolean
}

type Props = {
  ref?: React.Ref<BottomSheetModal>
  title: string
  items: SelectItem[]
  selectedValue?: string | number
  onValueSelected: (value: string | number, index: number) => void
}

// A settings option list in a sheet. Picking an option, leaving the screen
// or backgrounding the app closes the sheet.
const SettingsSelectSheet = ({
  ref,
  title,
  items,
  selectedValue,
  onValueSelected,
}: Props) => {
  const { t } = useTranslation()
  const { bottom } = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const sheetRef = useRef<BottomSheetModal>(null)
  useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal)

  const close = () => sheetRef.current?.dismiss()
  useDisappear(close)

  return (
    <Sheet ref={sheetRef} maxDynamicContentSize={Math.round(height * 0.8)}>
      <BottomSheetScrollView
        contentContainerStyle={{ paddingBottom: bottom }}
        contentContainerClassName="px-7"
      >
        <Text className="mb-4 mt-2 border-b border-border pb-3 text-muted-foreground">
          {title}
        </Text>
        {items.map(({ label, value, Icon, disabled }, index) => {
          const selected = value === selectedValue
          return (
            <PressableScale
              key={value}
              testID={`ActionSheet.${value}`}
              feedback="opacity"
              disabled={disabled}
              onPress={() => {
                close()
                onValueSelected(value, index)
              }}
              className="h-[50px] flex-row items-center gap-3"
            >
              {!!Icon && <Icon width={16} height={16} />}
              <Text
                size="lg"
                className={twMerge(
                  disabled && 'text-muted-foreground',
                  selected && 'font-medium text-purple-500',
                )}
              >
                {label}
              </Text>
            </PressableScale>
          )
        })}
        <Button
          variant="secondary"
          size="dashboard"
          className="my-4 w-full"
          onPress={close}
        >
          {t('generic.cancel')}
        </Button>
      </BottomSheetScrollView>
    </Sheet>
  )
}

export default SettingsSelectSheet
