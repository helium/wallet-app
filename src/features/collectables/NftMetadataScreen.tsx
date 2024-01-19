import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteProp, useRoute } from '@react-navigation/native'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import Text from '@components/Text'
import SafeAreaBox from '@components/SafeAreaBox'
import { ScrollView } from 'react-native-gesture-handler'
import { CollectableStackParamList } from './collectablesTypes'

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

  const renderProperty = useCallback(
    (
      traitType: string | undefined,
      traitValue: boolean | string | string[] | undefined,
    ) => (
      <Box
        padding="s"
        paddingHorizontal="m"
        borderRadius="round"
        backgroundColor="transparent10"
        margin="s"
        key={`${traitType}+${stringify(traitValue)}`}
      >
        <Text variant="subtitle4" color="grey600">
          {traitType?.toUpperCase() ||
            t('collectablesScreen.collectables.noTraitType')}
        </Text>
        <Text variant="body1" color="white" textAlign="center">
          {stringify(traitValue) ||
            t('collectablesScreen.collectables.noTraitValue')}
        </Text>
      </Box>
    ),
    [t],
  )

  return (
    <BackScreen
      title={t('collectablesScreen.metadata')}
      padding="none"
      headerTopMargin="l"
    >
      <ScrollView>
        <SafeAreaBox alignItems="center" flex={1}>
          <Text variant="subtitle1" color="grey600" marginBottom="l">
            {t('collectablesScreen.collectables.properties')}
          </Text>
          <Box
            flexDirection="row"
            paddingHorizontal="m"
            flexWrap="wrap"
            justifyContent="center"
          >
            {metadata.attributes?.map(({ trait_type, value }: any) =>
              renderProperty(trait_type, value),
            )}
          </Box>
        </SafeAreaBox>
      </ScrollView>
    </BackScreen>
  )
}

export default NftMetadataScreen
