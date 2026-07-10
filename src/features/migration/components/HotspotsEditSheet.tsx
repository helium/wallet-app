import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import React, { forwardRef, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItem } from 'react-native'
import { MigratableHotspot } from '../hooks/useMigrationAssets'

type Props = {
  hotspots: MigratableHotspot[]
  selected: Set<string>
  onToggle: (entityKey: string) => void
}

// Memoized with primitive props so a toggle (or any parent re-render, e.g. a
// price-poll tick) only re-renders the rows whose selection actually changed.
const HotspotRow = memo(
  ({
    entityKey,
    name,
    type,
    deviceType,
    isSelected,
    onToggle,
  }: MigratableHotspot & {
    isSelected: boolean
    onToggle: (entityKey: string) => void
  }) => {
    const handlePress = useCallback(
      () => onToggle(entityKey),
      [onToggle, entityKey],
    )
    return (
      <TouchableOpacityBox
        onPress={handlePress}
        flexDirection="row"
        alignItems="center"
        paddingHorizontal="l"
        paddingVertical="m"
      >
        <Box
          width={22}
          height={22}
          borderRadius="s"
          marginRight="m"
          backgroundColor={isSelected ? 'worldPurple' : 'transparent'}
          borderWidth={isSelected ? 0 : 1.5}
          borderColor="secondaryText"
        />
        <Box flex={1}>
          <Text variant="body2Medium" color="primaryText">
            {name}
          </Text>
          <Text variant="body3" color="secondaryText">
            {type} · {deviceType}
          </Text>
        </Box>
      </TouchableOpacityBox>
    )
  },
)
HotspotRow.displayName = 'HotspotRow'

const HotspotsEditSheet = forwardRef<BottomSheet, Props>(
  ({ hotspots, selected, onToggle }, ref) => {
    const { t } = useTranslation()
    const renderItem = useCallback<ListRenderItem<MigratableHotspot>>(
      ({ item }) => (
        <HotspotRow
          {...item}
          isSelected={selected.has(item.entityKey)}
          onToggle={onToggle}
        />
      ),
      [selected, onToggle],
    )
    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['70%']}
        enablePanDownToClose
      >
        <Box paddingHorizontal="l" paddingBottom="s">
          <Text variant="h4" color="primaryText">
            {t('migrateToWorld.selectAssets.hotspots')}
          </Text>
        </Box>
        <BottomSheetFlatList<MigratableHotspot>
          data={hotspots}
          keyExtractor={(h) => h.entityKey}
          renderItem={renderItem}
        />
      </BottomSheet>
    )
  },
)

HotspotsEditSheet.displayName = 'HotspotsEditSheet'

export default HotspotsEditSheet
