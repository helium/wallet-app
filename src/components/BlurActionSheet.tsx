import React, { memo, useCallback, useMemo, useRef } from 'react'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { Edge } from 'react-native-safe-area-context'
import { useAsync } from 'react-async-hook'
import { Portal } from '@gorhom/portal'
import { ThemeProvider } from '@shopify/restyle'
import { lightTheme } from '@theme/theme'
import { useTranslation } from 'react-i18next'
import SafeAreaBox from './SafeAreaBox'
import HeliumBottomSheet from './HeliumBottomSheet'
import Text from './Text'

type Props = {
  title: string
  open?: boolean
  children: React.JSX.Element
  onClose?: () => void
}

const BlurActionSheet = ({ title, open, children, onClose }: Props) => {
  const bottomSheetModalRef = useRef<BottomSheet>(null)
  const { t } = useTranslation()

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
        <SafeAreaBox flex={1}>
          <Text
            variant="textLgSemibold"
            color="primaryText"
            marginTop="xl"
            textAlign="center"
          >
            {t('blurActionSheet.selectAnOption')}
          </Text>
        </SafeAreaBox>
      </BottomSheetBackdrop>
    ),
    [handleOnClose, title, t],
  )

  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])

  return (
    <Portal>
      <HeliumBottomSheet
        ref={bottomSheetModalRef}
        index={-1}
        backdropComponent={renderBackdrop}
      >
        <ThemeProvider theme={lightTheme}>
          <BottomSheetScrollView>
            <SafeAreaBox edges={safeEdges} padding="xl" marginTop="xl">
              {children}
            </SafeAreaBox>
          </BottomSheetScrollView>
        </ThemeProvider>
      </HeliumBottomSheet>
    </Portal>
  )
}

export default memo(BlurActionSheet)
