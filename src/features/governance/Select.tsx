import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { PressableScale } from '@ui/PressableScale'
import { Sheet } from '@ui/Sheet'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { ChevronDown, CircleCheck } from 'lucide-react-native'
import React, { useRef } from 'react'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'

const SafeArea = withUniwind(TabSafeAreaView)
const ChevronDownIcon = withUniwind(ChevronDown)
const SelectedIcon = withUniwind(CircleCheck)

export type SelectProps = {
  title: string
  value: string
  onValueChange: (value: string) => void
  options: {
    label: string
    value: string
    icon?: React.ReactNode
  }[]
  testID?: string
  className?: string
}
export const Select: React.FC<SelectProps> = ({
  title,
  value,
  onValueChange,
  options,
  testID,
  className,
}) => {
  const sheetRef = useRef<BottomSheetModal>(null)
  const selected = options.find((o) => o.value === value)

  return (
    <>
      <PressableScale
        testID={testID}
        feedback="opacity"
        className={twMerge(
          'flex-row items-center justify-between rounded-[12px] border border-border bg-card p-4',
          className,
        )}
        onPress={() => sheetRef.current?.present()}
      >
        <View className="flex-row items-center gap-2">
          {selected?.icon}
          <Text>{selected?.label}</Text>
        </View>
        <ChevronDownIcon size={16} colorClassName="accent-muted-foreground" />
      </PressableScale>
      <Sheet ref={sheetRef} enablePanDownToClose>
        <BottomSheetView>
          <SafeArea edges={['bottom']} className="pb-4">
            {title ? (
              <Text size="xl" className="px-6 pb-2 tracking-tight">
                {title}
              </Text>
            ) : null}
            {options.map((option) => (
              <PressableScale
                key={option.value}
                testID={`Select.${option.value}`}
                accessibilityState={{ selected: value === option.value }}
                feedback="opacity"
                className="flex-row items-center justify-between px-6 py-4"
                onPress={() => {
                  onValueChange(option.value)
                  sheetRef.current?.dismiss()
                }}
              >
                <Text size="base" className="font-medium">
                  {option.label}
                </Text>
                {value === option.value ? (
                  <SelectedIcon size={20} colorClassName="accent-primary" />
                ) : null}
              </PressableScale>
            ))}
          </SafeArea>
        </BottomSheetView>
      </Sheet>
    </>
  )
}
