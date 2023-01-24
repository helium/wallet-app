import React, {
  forwardRef,
  memo,
  ReactNode,
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import Checkmark from '@assets/images/checkmark.svg'
import { useTranslation } from 'react-i18next'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackgroundProps,
} from '@gorhom/bottom-sheet'
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Portal } from '@gorhom/portal'
import SafeAreaBox from '../../components/SafeAreaBox'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { useColors, useOpacity } from '../../theme/themeHooks'
import ButtonPressable from '../../components/ButtonPressable'
import useLayoutHeight from '../../hooks/useLayoutHeight'

export type WalletSignBottomSheetRef = {
  show: () => Promise<boolean>
  hide: () => void
}

type Props = {
  onClose: () => void
  children: ReactNode
}

let promiseResolve: (value: boolean | PromiseLike<boolean>) => void

const WalletSignBottomSheet = forwardRef(
  ({ onClose, children }: Props, ref: Ref<WalletSignBottomSheetRef>) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const { primaryText, secondaryText } = useColors()
    const { t } = useTranslation()
    const bottomSheetModalRef = useRef<BottomSheet>(null)
    const [containerHeight, setContainerHeight] = useLayoutHeight()

    // const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)
    const safeEdges = useMemo(() => ['bottom'] as Edge[], [])

    const snapPoints = useMemo(() => ['44%'], [])

    const hide = useCallback(() => {
      bottomSheetModalRef.current?.close()
    }, [])

    const show = useCallback(() => {
      bottomSheetModalRef.current?.expand()
      // setIsShowing(true)
      const p = new Promise<boolean>((resolve) => {
        promiseResolve = resolve
      })
      return p
    }, [])

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
      ),
      [],
    )

    const handleModalDismiss = useCallback(() => {
      // handleDismiss()
      if (promiseResolve) {
        promiseResolve(false)
      }
      onClose()
    }, [onClose])

    const handleIndicatorStyle = useMemo(() => {
      return {
        backgroundColor: secondaryText,
      }
    }, [secondaryText])

    const onAcceptHandler = useCallback(() => {
      if (promiseResolve) {
        promiseResolve(true)
        hide()
      }
    }, [hide])

    const onCancelHandler = useCallback(() => {
      if (promiseResolve) {
        promiseResolve(false)
        hide()
      }
    }, [hide])
    return (
      <Box flex={1}>
        {children}
        <Portal>
          <BottomSheet
            ref={bottomSheetModalRef}
            index={-1}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            snapPoints={snapPoints}
            onClose={handleModalDismiss}
            handleIndicatorStyle={handleIndicatorStyle}
            // https://ethercreative.github.io/react-native-shadow-generator/
            style={{
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 12,
              },
              shadowOpacity: 0.58,
              shadowRadius: 16.0,
              elevation: 24,
            }}
          >
            <SafeAreaBox
              edges={safeEdges}
              padding="m"
              flex={1}
              onLayout={setContainerHeight}
            >
              <Text
                variant="body1Medium"
                color="secondaryText"
                textAlign="center"
              >
                app.realms.today
              </Text>
              <Box flexGrow={1} justifyContent="center">
                <Box
                  borderRadius="l"
                  backgroundColor="secondaryBackground"
                  flexDirection="column"
                  padding="m"
                >
                  <Box flexDirection="row" marginBottom="m">
                    <Checkmark color="white" />
                    <Text variant="body1" marginStart="s">
                      View your wallet balance & activity
                    </Text>
                  </Box>
                  <Box flexDirection="row">
                    <Checkmark color="white" />
                    <Text marginStart="s" variant="body1">
                      Request Approval for transactions
                    </Text>
                  </Box>
                </Box>
                <Box>
                  <Text
                    variant="body1"
                    color="secondaryText"
                    textAlign="center"
                    marginTop="m"
                  >
                    Only connect to websites you trust
                  </Text>
                </Box>
              </Box>

              <Box
                flexDirection="row"
                justifyContent="space-between"
                marginBottom="s"
              >
                <ButtonPressable
                  width="48%"
                  borderRadius="round"
                  backgroundColor="white"
                  backgroundColorOpacity={0.1}
                  backgroundColorOpacityPressed={0.05}
                  titleColorPressedOpacity={0.3}
                  titleColor="white"
                  title="Cancel"
                  onPress={onCancelHandler}
                />

                <ButtonPressable
                  width="48%"
                  borderRadius="round"
                  backgroundColor="white"
                  backgroundColorOpacityPressed={0.7}
                  backgroundColorDisabled="surfaceSecondary"
                  backgroundColorDisabledOpacity={0.5}
                  titleColorDisabled="secondaryText"
                  title="Connect"
                  titleColor="black"
                  onPress={onAcceptHandler}
                />
              </Box>
            </SafeAreaBox>
          </BottomSheet>
        </Portal>
      </Box>
    )
  },
)

export default memo(WalletSignBottomSheet)
