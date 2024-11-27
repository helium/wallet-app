import Box from '@components/Box'
import { NavBarHeight } from '@components/ServiceNavBar'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Text from '@components/Text'
import ButtonPressable from '@components/ButtonPressable'
import AddIcon from '@assets/svgs/add.svg'
import { Image, Linking } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { HotspotServiceNavigationProp } from 'src/app/services/HotspotService'

const EmptyState = () => {
  const spacing = useSpacing()
  const colors = useColors()
  const { t } = useTranslation()
  const { bottom } = useSafeAreaInsets()
  const navigation = useNavigation<HotspotServiceNavigationProp>()

  const onLearnMore = useCallback(() => {
    Linking.openURL('https://hellohelium.com/hotspot')
  }, [])

  const onAddHotspot = useCallback(() => {
    navigation.navigate('AddHotspot')
  }, [navigation])

  return (
    <Box
      backgroundColor="transparent"
      position="absolute"
      bottom={bottom + NavBarHeight + spacing.xs}
      left={0}
      right={0}
      paddingHorizontal="2xl"
      zIndex={100}
    >
      <Box
        padding="2xl"
        backgroundColor="primaryText"
        borderRadius="6xl"
        alignItems="center"
        paddingTop="8xl"
      >
        <Image source={require('@assets/images/mobileHotspot.png')} />
        <Text
          variant="displayXsSemibold"
          color="primaryBackground"
          marginTop="2xl"
        >
          {t('HotspotPage.noHotspotsTitle')}
        </Text>
        <Text
          variant="textXlMedium"
          color="text.quaternary-500"
          marginTop="2.5"
          marginBottom="8xl"
          textAlign="center"
          paddingHorizontal="2"
        >
          {t('HotspotPage.noHotspotsSubtitle')}
        </Text>
        <Box gap="2" flexDirection="row">
          <ButtonPressable
            flex={1}
            backgroundColor="primaryBackground"
            titleColor="primaryText"
            title={t('HotspotPage.learnMore')}
            onPress={onLearnMore}
          />
          <ButtonPressable
            flex={1}
            backgroundColor="fg.tertiary-hover"
            titleColor="primaryBackground"
            title={t('HotspotPage.add')}
            onPress={onAddHotspot}
            LeadingComponent={
              <AddIcon
                width={17.06}
                height={17.06}
                color={colors.primaryBackground}
              />
            }
          />
        </Box>
      </Box>
    </Box>
  )
}

export default EmptyState
