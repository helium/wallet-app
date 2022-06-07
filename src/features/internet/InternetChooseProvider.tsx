import { AnimatePresence } from 'moti'
import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import BlurBox from '../../components/BlurBox'
import Box from '../../components/Box'
import MotiBox from '../../components/MotiBox'
import FabButton from '../../components/FabButton'
import Text from '../../components/Text'
import SafeAreaBox from '../../components/SafeAreaBox'
import { Moti } from '../../config/animationConfig'
import useInternetProviders, { InternetProvider } from './useInternetProviders'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useSpacing } from '../../theme/themeHooks'

type ListItem = { item: InternetProvider; index: number }

type Props = { visible?: boolean; top: number; onClose: () => void }
const InternetChooseProvider = ({ visible, top, onClose }: Props) => {
  const { t } = useTranslation()
  const providers = useInternetProviders()
  const spacing = useSpacing()

  const selectProvider = useCallback(
    (provider: InternetProvider) => () => {
      provider.action()
      onClose()
    },
    [onClose],
  )

  const keyExtractor = useCallback((item) => item.name, [])

  const renderItem = useCallback(
    ({ index: _index, item }: ListItem) => {
      return (
        <TouchableOpacityBox
          backgroundColor="surface"
          height={65}
          borderRadius="round"
          alignItems="center"
          justifyContent="center"
          onPress={selectProvider(item)}
          marginBottom="l"
        >
          <item.Icon />
        </TouchableOpacityBox>
      )
    },
    [selectProvider],
  )

  const flatListContainerStyle = useMemo(
    () => ({
      padding: spacing.xxl,
      paddingBottom: spacing.none,
    }),
    [spacing.none, spacing.xxl],
  )

  return (
    <AnimatePresence>
      {visible && (
        <MotiBox
          position="absolute"
          top={top}
          left={0}
          right={0}
          bottom={0}
          borderRadius="xl"
          overflow="hidden"
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...Moti.fade}
        >
          <BlurBox position="absolute" top={0} bottom={0} left={0} right={0} />
          <SafeAreaBox flex={1} alignItems="center">
            <FabButton
              size={60}
              marginTop="xxl"
              icon="payment"
              backgroundColor="orange500"
              backgroundColorOpacity={0.2}
              iconColor="orange500"
              disabled
            />

            <Text variant="h1" marginVertical="m">
              {t('internet.chooseProvider.title')}
            </Text>
            <Text variant="body1" color="secondaryText" textAlign="center">
              {t('internet.chooseProvider.subtitle')}
            </Text>
            <Box flex={1} width="100%" marginBottom="m">
              <FlatList
                data={providers}
                contentContainerStyle={flatListContainerStyle}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
              />
            </Box>
            <FabButton
              size={48}
              onPress={onClose}
              icon="close"
              backgroundColor="primaryText"
              iconColor="black400"
              marginBottom="l"
            />
          </SafeAreaBox>
        </MotiBox>
      )}
    </AnimatePresence>
  )
}

export default memo(InternetChooseProvider)
