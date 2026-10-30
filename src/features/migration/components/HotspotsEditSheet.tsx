import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet'
import { Checkbox } from '@ui/Checkbox'
import { PressableScale } from '@ui/PressableScale'
import { Sheet } from '@ui/Sheet'
import { Text } from '@ui/Text'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { MigratableHotspot } from '../hooks/useMigrationAssets'

type Props = {
  ref?: React.Ref<BottomSheetModal>
  hotspots: MigratableHotspot[]
  selected: Set<string>
  onToggle: (entityKey: string) => void
}

const HotspotRow = ({
  entityKey,
  name,
  type,
  deviceType,
  isSelected,
  onToggle,
}: MigratableHotspot & {
  isSelected: boolean
  onToggle: (entityKey: string) => void
}) => (
  <PressableScale
    onPress={() => onToggle(entityKey)}
    accessibilityRole="checkbox"
    accessibilityState={{ checked: isSelected }}
    feedback="opacity"
    className="flex-row items-center px-6 py-3"
  >
    <Checkbox
      checked={isSelected}
      accessible={false}
      importantForAccessibility="no"
      onChange={() => onToggle(entityKey)}
      className="mr-4"
    />
    <View className="flex-1">
      <Text className="font-medium">{name}</Text>
      <Text size="xs" className="text-muted-foreground">
        {type} · {deviceType}
      </Text>
    </View>
  </PressableScale>
)

const HotspotsEditSheet = ({ ref, hotspots, selected, onToggle }: Props) => {
  const { t } = useTranslation()
  return (
    <Sheet ref={ref} snapPoints={['70%']} enablePanDownToClose>
      <View className="px-6 pb-2">
        <Text size="xl" className="tracking-tight">
          {t('migrateToWorld.selectAssets.hotspots')}
        </Text>
      </View>
      <BottomSheetFlatList<MigratableHotspot>
        contentInsetAdjustmentBehavior="automatic"
        data={hotspots}
        keyExtractor={(h) => h.entityKey}
        renderItem={({ item }) => (
          <HotspotRow
            {...item}
            isSelected={selected.has(item.entityKey)}
            onToggle={onToggle}
          />
        )}
      />
    </Sheet>
  )
}

export default HotspotsEditSheet
