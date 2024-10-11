import React, { useCallback, useMemo, useRef, useState } from 'react'
import Box from '@components/Box'
import BottomSheet from '@gorhom/bottom-sheet'
import { useSpacing } from '@theme/themeHooks'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { ReAnimatedBox, Text } from '@components'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import AccountIcon from '@components/AccountIcon'
import SideDrawer from '@components/SideDrawer'
import MenuButton from '@components/MenuButton'
import { useNavigation } from '@react-navigation/native'
import { ThemeProvider } from '@shopify/restyle'
import { lightTheme } from '@theme/theme'
import HeliumBottomSheet from '@components/HeliumBottomSheet'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { FadeInSlow } from '@components/FadeInOut'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ServiceSheetNavigationProp } from './serviceSheetTypes'

type ServiceSheetProps = {
  currentService: string
  children?: React.ReactNode
}

const ServiceSheet = ({ children, currentService }: ServiceSheetProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(true)
  const bottomSheetRef = useRef<BottomSheet>(null)
  const serviceNav = useNavigation<ServiceSheetNavigationProp>()
  const { top } = useSafeAreaInsets()

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
    },
    [serviceNav],
  )

  const onDrawerPress = useCallback(() => {
    setIsExpanded((s) => !s)
  }, [])

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
    if (currentService === '') return

    // TODO: Bring this back once we have the stickers page
    // bottomSheetRef.current?.close()
  }, [bottomSheetRef, currentService])

  const onChangeSheet = useCallback((index: number) => {
    setBottomSheetOpen(index === 0)
  }, [])

  return (
    <ReAnimatedBox entering={FadeInSlow} flex={1} style={{ paddingTop: top }}>
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
      <HeliumBottomSheet
        ref={bottomSheetRef}
        onChange={onChangeSheet}
        index={0}
      >
        <ThemeProvider theme={lightTheme}>
          <Box
            flex={1}
            height="100%"
            flexDirection="column"
            zIndex={100}
            position="relative"
          >
            {children}
          </Box>
        </ThemeProvider>
      </HeliumBottomSheet>
    </ReAnimatedBox>
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
  const wallet = useCurrentWallet()

  const titleAsWord = useMemo(() => {
    if (!title || title === '') return ''
    return title?.charAt(0).toUpperCase() + title?.slice(1)
  }, [title])

  return (
    <TouchableOpacityBox
      flex={1}
      flexDirection="row"
      padding="5"
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
          <AccountIcon size={36} address={wallet?.toBase58()} />
        </Box>
      </TouchableOpacityBox>
    </TouchableOpacityBox>
  )
}

export default ServiceSheet
