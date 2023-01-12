import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteProp, useRoute } from '@react-navigation/native'
import BackScreen from '../../components/BackScreen'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { CollectableStackParamList } from './collectablesTypes'
import SafeAreaBox from '../../components/SafeAreaBox'

type Route = RouteProp<CollectableStackParamList, 'NftMetadataScreen'>

const NftMetadataScreen = () => {
  const route = useRoute<Route>()
  const { t } = useTranslation()
  const { metadata } = route.params

  const renderProperty = useCallback(
    (traitType: string | undefined, traitValue: string | undefined) => (
      <Box
        padding="s"
        paddingHorizontal="m"
        borderRadius="round"
        backgroundColor="transparent10"
        margin="s"
        key={`${traitType}+${traitValue}`}
      >
        <Text variant="subtitle4" color="grey600">
          {traitType?.toUpperCase() ||
            t('collectablesScreen.collectables.noTraitType')}
        </Text>
        <Text variant="body1" color="white" textAlign="center">
          {traitValue || t('collectablesScreen.collectables.noTraitValue')}
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
          {metadata.attributes?.map(({ trait_type, value }) =>
            renderProperty(trait_type, value),
          )}
        </Box>
      </SafeAreaBox>
    </BackScreen>
  )
}

export default NftMetadataScreen
