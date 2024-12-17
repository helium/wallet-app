import React, { useCallback, useMemo, memo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import 'text-encoding-polyfill'
import { useTranslation } from 'react-i18next'
import Face from '@assets/svgs/face.svg'
import ArrowRight from '@assets/svgs/arrowRight.svg'
import { DelayedFadeIn } from '@components/FadeInOut'
import globalStyles from '@config/theme/globalStyles'
import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import Text from '@components/Text'
import BackScreen from '@components/BackScreen'
import { useSpacing } from '@config/theme/themeHooks'
import { ReAnimatedBox } from '@components/AnimatedBox'
import ScrollBox from '@components/ScrollBox'
import {
  WalletNavigationProp,
  WalletStackParamList,
} from '@services/WalletService/pages/WalletPage'
import { useBottomSpacing } from '@hooks/useBottomSpacing'
import ButtonPressable from '@components/ButtonPressable'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import NftMetadata from './NftMetadata'
import { ww } from '../../utils/layout'
import { CompressedNFT } from '../../types/solana'

type Route = RouteProp<WalletStackParamList, 'NftDetailsScreen'>

const NftDetailsScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<WalletNavigationProp>()
  const COLLECTABLE_HEIGHT = ww
  const bottomSpacing = useBottomSpacing()
  const { editAvatar } = useAccountStorage()

  const { t } = useTranslation()

  const { collectable }: { collectable: CompressedNFT } = route.params
  const { content } = collectable

  const spacing = useSpacing()

  const handleSend = useCallback(() => {
    navigation.navigate('TransferCollectableScreen', {
      collectable,
    })
  }, [collectable, navigation])

  const imageUri = useMemo(() => {
    return content?.files?.[0]?.uri
  }, [content])

  const updateAvatar = useCallback(async () => {
    await editAvatar(imageUri)
  }, [imageUri, editAvatar])

  const TransferButton = useCallback(() => {
    return (
      <Box gap="2" alignItems="center">
        <ButtonPressable
          onPress={handleSend}
          flexDirection="row"
          backgroundColor="primaryText"
          backgroundColorPressed="primaryText"
          width={60}
          height={60}
          borderRadius="full"
          Icon={ArrowRight}
          titleColor="primaryBackground"
          iconProps={{
            width: 16,
            height: 16,
          }}
        />
        <Text variant="textXsSemibold" color="primaryText" flexWrap="wrap">
          {t('collectablesScreen.transfer')}
        </Text>
      </Box>
    )
  }, [t, handleSend])

  const AvatarButton = useCallback(() => {
    return (
      <Box
        gap="2"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
      >
        <ButtonPressable
          onPress={updateAvatar}
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          backgroundColor="primaryText"
          backgroundColorPressed="primaryText"
          width={60}
          height={60}
          borderRadius="full"
          titleColor="primaryBackground"
          Icon={Face}
          iconProps={{
            width: 28,
            height: 28,
          }}
        />
        <Text
          variant="textXsSemibold"
          color="primaryText"
          flexWrap="wrap"
          textAlign="center"
        >
          {t('collectablesScreen.nfts.setAsAvatar')}
        </Text>
      </Box>
    )
  }, [t, updateAvatar])

  const isNFT = useMemo(() => {
    return ['programmablenft', 'v1_nft', 'v2_nft', 'legacy_nft'].includes(
      collectable.interface?.toLowerCase(),
    )
  }, [collectable])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <ScrollBox>
        <BackScreen
          padding="5"
          title={t('collectablesScreen.nfts.nftDetailTitle')}
          edges={[]}
          headerTopMargin="6xl"
          headerHorizontalPadding="5"
        >
          <ScrollBox>
            <Box flex={1}>
              {content && (
                <Box alignItems="center">
                  <ImageBox
                    marginTop="6"
                    backgroundColor={
                      imageUri ? 'primaryBackground' : 'bg.tertiary'
                    }
                    height={COLLECTABLE_HEIGHT - spacing['6'] * 2}
                    width={COLLECTABLE_HEIGHT - spacing['6'] * 2}
                    source={{ uri: imageUri, cache: 'force-cache' }}
                    borderRadius="4xl"
                  />
                </Box>
              )}
              <Text
                marginTop="6"
                marginBottom="2"
                textAlign="center"
                variant="displayMdMedium"
              >
                {content?.metadata?.name}
              </Text>
              <Text
                variant="textXsMedium"
                color="gray.600"
                marginBottom="8"
                textAlign="center"
              >
                {content?.metadata?.description ||
                  t('collectables.noDescription')}
              </Text>
              <Box flexDirection="row">
                {isNFT && (
                  <Box
                    flexDirection="row"
                    gap="2"
                    flex={1}
                    justifyContent="center"
                  >
                    <TransferButton />
                    <AvatarButton />
                  </Box>
                )}
              </Box>
              <Box
                flex={1}
                marginTop="2xl"
                style={{ marginBottom: bottomSpacing }}
              >
                <NftMetadata metadata={content?.metadata} />
              </Box>
            </Box>
          </ScrollBox>
        </BackScreen>
      </ScrollBox>
    </ReAnimatedBox>
  )
}

export default memo(NftDetailsScreen)
