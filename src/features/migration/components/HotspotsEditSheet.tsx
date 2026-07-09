import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import React, { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MigratableHotspot } from '../hooks/useMigrationAssets'

type Props = {
  hotspots: MigratableHotspot[]
  selected: Set<string>
  onToggle: (entityKey: string) => void
}

const HotspotsEditSheet = forwardRef<BottomSheet, Props>(
  ({ hotspots, selected, onToggle }, ref) => {
    const { t } = useTranslation()
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
          renderItem={({ item }) => (
            <TouchableOpacityBox
              onPress={() => onToggle(item.entityKey)}
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
                backgroundColor={
                  selected.has(item.entityKey) ? 'worldPurple' : 'transparent'
                }
                borderWidth={selected.has(item.entityKey) ? 0 : 1.5}
                borderColor="secondaryText"
              />
              <Box flex={1}>
                <Text variant="body2Medium" color="primaryText">
                  {item.name}
                </Text>
                <Text variant="body3" color="secondaryText">
                  {item.type} · {item.deviceType}
                </Text>
              </Box>
            </TouchableOpacityBox>
          )}
        />
      </BottomSheet>
    )
  },
)

HotspotsEditSheet.displayName = 'HotspotsEditSheet'

export default HotspotsEditSheet
