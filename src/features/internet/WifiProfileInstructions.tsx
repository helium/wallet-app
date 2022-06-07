import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Platform } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import Close from '@assets/images/close.svg'
import { useNavigation } from '@react-navigation/native'
import Box from '../../components/Box'
import SafeAreaBox from '../../components/SafeAreaBox'
import Text from '../../components/Text'
import TextTransform from '../../components/TextTransform'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors, useHitSlop } from '../../theme/themeHooks'
import { InternetNavigationProp } from './internetTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useFeatureFlagsQuery } from '../../generated/graphql'

const WifiProfileInstructions = () => {
  const { currentAccount } = useAccountStorage()
  const { data: flags } = useFeatureFlagsQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    skip: !currentAccount?.address,
  })
  const { t } = useTranslation()
  const navigation = useNavigation<InternetNavigationProp>()
  const colors = useColors()
  const hitSlop = useHitSlop('l')
  const safeAreaEdges = useMemo(
    (): Edge[] =>
      Platform.OS === 'android'
        ? ['top', 'left', 'right', 'bottom']
        : ['left', 'right', 'bottom'],
    [],
  )

  const instructions = useMemo(
    () =>
      t(`internet.wifiProfile.instructions.${Platform.OS}`, {
        returnObjects: true,
      }) as string[],
    [t],
  )

  const openProfileLink = useCallback(() => {
    if (!flags?.featureFlags.wifiProfile) return
    Linking.openURL(flags.featureFlags.wifiProfile)
  }, [flags])

  return (
    <SafeAreaBox
      flex={1}
      alignItems="center"
      paddingTop="l"
      edges={safeAreaEdges}
      marginHorizontal="l"
    >
      <TouchableOpacityBox
        hitSlop={hitSlop}
        alignSelf="flex-end"
        onPress={navigation.getParent()?.goBack}
      >
        <Close color={colors.primaryText} />
      </TouchableOpacityBox>
      <Text variant="medium" fontSize={31} color="primaryText">
        {t('internet.wifiProfile.title')}
      </Text>
      <Text variant="subtitle2" color="primaryText" marginVertical="xxl">
        {t('internet.wifiProfile.subtitle')}
      </Text>

      <Text variant="body1" color="primaryText" marginBottom="xl">
        {t('internet.wifiProfile.instructions.title')}
      </Text>

      {instructions.map((instruction, index) => (
        <Box
          flexDirection="row"
          alignSelf="flex-start"
          marginBottom="s"
          // eslint-disable-next-line react/no-array-index-key
          key={`${index}.${instruction}`}
        >
          <Text variant="body1" color="primaryText">
            {`${index + 1}. `}
          </Text>
          <Box flex={1}>
            <TextTransform
              i18nKey={`internet.wifiProfile.instructions.${Platform.OS}.${index}`}
              variant="body1"
              color="primaryText"
            />
          </Box>
        </Box>
      ))}
      <Box flex={1} justifyContent="flex-end" width="100%">
        <TouchableOpacityBox
          backgroundColor="surfaceContrast"
          padding="lm"
          borderRadius="round"
          onPress={openProfileLink}
        >
          <Text
            variant="subtitle1"
            color="surfaceContrastText"
            textAlign="center"
          >
            {t('internet.wifiProfile.download')}
          </Text>
        </TouchableOpacityBox>
      </Box>
    </SafeAreaBox>
  )
}

export default memo(WifiProfileInstructions)
