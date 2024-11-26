import React, { memo, useCallback, useRef } from 'react'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAsync } from 'react-async-hook'
import { Portal } from '@gorhom/portal'
import { ThemeProvider } from '@shopify/restyle'
import { lightTheme } from '@config/theme/theme'
import { useTranslation } from 'react-i18next'
import { useSpacing } from '@config/theme/themeHooks'
import HeliumBottomSheet from './HeliumBottomSheet'
import Text from './Text'
import Box from './Box'
import ScrollBox from './ScrollBox'

type Props = {
  title: string
  open?: boolean
  children: React.JSX.Element
  onClose?: () => void
}

const BlurActionSheet = ({ title, open, children, onClose }: Props) => {
  const bottomSheetModalRef = useRef<BottomSheet>(null)
  const { t } = useTranslation()
  const { top, bottom } = useSafeAreaInsets()
  const spacing = useSpacing()

  const handleOnClose = useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])

  useAsync(async () => {
    if (open) {
      await bottomSheetModalRef.current?.expand()
    } else {
      await bottomSheetModalRef.current?.close()
    }
  }, [open])

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        onPress={handleOnClose}
        title={title}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={1}
        {...props}
      >
        <Box flex={1} style={{ marginTop: top }}>
          <Text
            variant="textLgSemibold"
            color="primaryText"
            marginTop="xl"
            textAlign="center"
          >
            {t('blurActionSheet.selectAnOption')}
          </Text>
        </Box>
      </BottomSheetBackdrop>
    ),
    [handleOnClose, title, top, t],
  )

  return (
    <Portal>
      <HeliumBottomSheet
        ref={bottomSheetModalRef}
        index={-1}
        backdropComponent={renderBackdrop}
        onClose={handleOnClose}
      >
        <ThemeProvider theme={lightTheme}>
          <Box
            flex={1}
            flexDirection="column"
            zIndex={100}
            position="relative"
            borderRadius="6xl"
            overflow="hidden"
            marginTop="1"
          >
            <ScrollBox
              paddingHorizontal="2xl"
              contentContainerStyle={{
                paddingBottom: bottom + spacing['6xl'],
                paddingTop: spacing['6xl'],
              }}
            >
              {children}
            </ScrollBox>
          </Box>
        </ThemeProvider>
      </HeliumBottomSheet>
    </Portal>
  )
}

export default memo(BlurActionSheet)
