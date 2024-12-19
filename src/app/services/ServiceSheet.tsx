import React, { useCallback, useMemo, useRef, useState } from 'react'
import Box from '@components/Box'
import BottomSheet from '@gorhom/bottom-sheet'
import {
  useBackgroundStyle,
  useBorderRadii,
  useColors,
  useSpacing,
} from '@config/theme/themeHooks'
import {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { ReAnimatedBox, Text } from '@components'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import AccountIcon from '@components/AccountIcon'
import SideDrawer from '@components/SideDrawer'
import MenuButton from '@components/MenuButton'
import { useNavigation } from '@react-navigation/native'
import { ThemeProvider } from '@shopify/restyle'
import { lightTheme } from '@config/theme/theme'
import HeliumBottomSheet from '@components/HeliumBottomSheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import {
  GestureResponderEvent,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { wh } from '@utils/layout'
import { useSelector } from 'react-redux'
import { RootState } from '@store/rootReducer'
import StickersPage from '@features/stickers/StickersPage'
import { StickerProvider } from '@features/stickers/StickerContext'
import { useSwipe } from '@hooks/useSwipe'
import { ServiceSheetNavigationProp } from './serviceSheetTypes'

type ServiceSheetProps = {
  currentService: string
  isChild?: boolean
  children?: React.ReactNode
}

const ServiceSheet = ({
  children,
  currentService,
  isChild,
}: ServiceSheetProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(true)
  const bottomSheetRef = useRef<BottomSheet>(null)
  const serviceNav = useNavigation<ServiceSheetNavigationProp>()
  const { top } = useSafeAreaInsets()
  const colors = useColors()
  const spacing = useSpacing()
  const bottomSheetStyle = useBackgroundStyle('primaryText')
  const borderRadii = useBorderRadii()

  const { rootSheetPosition } = useSelector((state: RootState) => state.app)

  const onSwipeRight = useCallback((_: GestureResponderEvent) => {
    setIsExpanded(true)
  }, [])

  const { onTouchStart, onTouchEnd } = useSwipe(undefined, onSwipeRight, 6)

  const onRoute = useCallback(
    (value: string) => {
      setIsExpanded(false)
      bottomSheetRef.current?.expand()

      switch (value) {
        default:
        case 'wallet':
          serviceNav.replace('WalletService')
          break
        case 'hotspots':
          serviceNav.replace('HotspotService')
          break
        case 'governance':
          serviceNav.replace('GovernanceService')
          break
        case 'browser':
          serviceNav.replace('BrowserService')
          break
        case 'notifications':
          serviceNav.replace('NotificationsService')
          break
        case 'settings':
          serviceNav.replace('SettingsService')
          break
      }

      changeNavigationBarColor(
        isExpanded ? colors.primaryText : colors.primaryBackground,
        undefined,
        true,
      )
    },
    [colors, serviceNav, isExpanded],
  )

  const onDrawerPress = useCallback(() => {
    setIsExpanded((s) => !s)
    changeNavigationBarColor(
      isExpanded ? colors.primaryText : colors.primaryBackground,
      undefined,
      true,
    )
  }, [colors, isExpanded])

  const onWalletIconPress = useCallback(() => {
    if (currentService === 'wallets' && bottomSheetOpen) {
      // TODO: Bring this back once we have the stickers page
      // bottomSheetRef.current?.close()
      return
    }

    serviceNav.replace('AccountsService')
    bottomSheetRef.current?.expand()
  }, [currentService, serviceNav, bottomSheetRef, bottomSheetOpen])

  const onCloseSheet = useCallback(() => {
    // if (currentService === '') return
    // TODO: Bring this back once we have the stickers page
    // bottomSheetRef.current?.close()
  }, [])

  const onChangeSheet = useCallback((index: number) => {
    setBottomSheetOpen(index === 0)
  }, [])

  const snapPoints = useMemo(() => {
    if (Platform.OS === 'ios') {
      return [
        wh -
          top -
          spacing[20] +
          interpolate(
            rootSheetPosition || 0,
            [0, wh],
            [0, 14],
            Extrapolation.CLAMP,
          ),
      ]
    }

    return [wh - top - spacing[20] - spacing[2]]
  }, [top, spacing, rootSheetPosition])

  const backgroundStyle = useMemo(
    () =>
      ({
        ...bottomSheetStyle,
        height: '100%',
        borderRadius: borderRadii['4xl'] + borderRadii['4xl'],
        backgroundColor: colors['fg.white'],
      } as StyleProp<ViewStyle>),
    [bottomSheetStyle, borderRadii, colors],
  )

  const sheetStyle = useAnimatedStyle(() => {
    if (!rootSheetPosition)
      return {
        transform: [{ scaleX: withSpring(1) }],
        opacity: withTiming(1),
      }

    return {
      transform: [
        {
          scaleX: withSpring(
            interpolate(
              rootSheetPosition,
              [0, wh],
              [1, 0.9],
              Extrapolation.CLAMP,
            ),
          ),
        },
      ],
      opacity: withTiming(
        interpolate(rootSheetPosition, [0, wh], [1, 0.15], Extrapolation.CLAMP),
      ),
    }
  }, [isChild, rootSheetPosition])

  return (
    <Box flex={1} style={{ paddingTop: top }}>
      <SideDrawer
        isExpanded={isExpanded}
        onRoute={onRoute}
        onClose={onDrawerPress}
      />
      <Header
        title={bottomSheetOpen ? currentService : ''}
        onDrawerPress={onDrawerPress}
        onWalletIconPress={onWalletIconPress}
        walletsSelected={bottomSheetOpen && currentService === 'wallets'}
        onClose={onCloseSheet}
      />
      <ReAnimatedBox flexGrow={1} style={[sheetStyle]}>
        <StickerProvider>
          <StickersPage />
        </StickerProvider>
        <HeliumBottomSheet
          ref={bottomSheetRef}
          onChange={onChangeSheet}
          index={0}
          snapPoints={snapPoints}
          backgroundStyle={backgroundStyle}
          // // TODO: Bring this back once we have the stickers page
          enablePanDownToClose={false}
          enableContentPanningGesture={false}
        >
          <ThemeProvider theme={lightTheme}>
            <Box
              flex={1}
              height="100%"
              flexDirection="column"
              zIndex={100}
              position="relative"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onTouchEndCapture={onTouchEnd}
            >
              {children}
            </Box>
          </ThemeProvider>
        </HeliumBottomSheet>
      </ReAnimatedBox>
    </Box>
  )
}

const Header = ({
  title,
  onDrawerPress,
  onWalletIconPress,
  walletsSelected,
  onClose,
}: {
  title?: string
  walletsSelected: boolean
  onDrawerPress: () => void
  onWalletIconPress: () => void
  onClose: () => void
}) => {
  const spacing = useSpacing()
  const { currentAccount } = useAccountStorage()

  const titleAsWord = useMemo(() => {
    if (!title || title === '') return ''
    return title?.charAt(0).toUpperCase() + title?.slice(1)
  }, [title])

  return (
    <TouchableOpacityBox
      // flex={1}
      flexDirection="row"
      paddingHorizontal="5"
      paddingTop="5"
      onPress={onClose}
      disabled
      // TODO: Bring this back once we have the stickers page
      // disabled={title === ''}
    >
      <MenuButton isOpen={false} onPress={onDrawerPress} />
      <Box flex={1}>
        <Text variant="textLgSemibold" color="primaryText" textAlign="center">
          {titleAsWord}
        </Text>
      </Box>
      <TouchableOpacityBox onPress={onWalletIconPress}>
        <Box>
          {walletsSelected && (
            <ReAnimatedBox
              entering={FadeIn}
              exiting={FadeOut}
              borderRadius="full"
              borderWidth={2}
              borderColor="primaryText"
              position="absolute"
              top={spacing['-xs']}
              bottom={spacing['-xs']}
              left={spacing['-xs']}
              right={spacing['-xs']}
            />
          )}
          <AccountIcon size={36} address={currentAccount?.solanaAddress} />
        </Box>
      </TouchableOpacityBox>
    </TouchableOpacityBox>
  )
}

export default ServiceSheet
