import React from 'react'
import { useTranslation } from 'react-i18next'
import { RouteProp, useRoute } from '@react-navigation/native'
import { Text } from '@ui/Text'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import BackHeader from './components/BackHeader'
import { CollectableStackParamList } from './collectablesTypes'

const SafeArea = withUniwind(SafeAreaView)

type Route = RouteProp<CollectableStackParamList, 'NftMetadataScreen'>

function stringify(
  s: boolean | string | string[] | undefined,
): string | undefined {
  if (Array.isArray(s)) {
    if (s.length === 0) {
      return 'None'
    }
    return s.join(', ')
  }

  return s?.toString()
}

const NftMetadataScreen = () => {
  const route = useRoute<Route>()
  const { t } = useTranslation()
  const { metadata } = route.params

  const renderProperty = (
    traitType: string | undefined,
    traitValue: boolean | string | string[] | undefined,
  ) => (
    <View
      className="m-2 rounded-full bg-secondary p-2 px-4"
      key={`${traitType}+${stringify(traitValue)}`}
    >
      <Text className="font-medium text-muted-foreground">
        {traitType?.toUpperCase() ||
          t('collectablesScreen.collectables.noTraitType')}
      </Text>
      <Text size="base" className="text-center">
        {stringify(traitValue) ||
          t('collectablesScreen.collectables.noTraitValue')}
      </Text>
    </View>
  )

  return (
    <SafeArea className="flex-1 bg-background">
      <BackHeader title={t('collectablesScreen.metadata')} className="mt-6" />
      <View className="flex-1">
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <SafeArea className="flex-1 items-center">
            <Text size="xl" className="mb-6 font-medium text-muted-foreground">
              {t('collectablesScreen.collectables.properties')}
            </Text>
            <View className="flex-row flex-wrap justify-center px-4">
              {metadata.attributes?.map(
                ({
                  trait_type,
                  value,
                }: {
                  trait_type: string
                  value: string
                }) => renderProperty(trait_type, value),
              )}
            </View>
          </SafeArea>
        </ScrollView>
      </View>
    </SafeArea>
  )
}

export default NftMetadataScreen
