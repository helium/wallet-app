import React, { useCallback } from 'react'
import { AnimatePresence } from 'moti'
import { Portal } from '@gorhom/portal'
import { FullWindowOverlay } from 'react-native-screens'
import { StyleSheet } from 'react-native'
import Box from './Box'
import MotiBox from './MotiBox'
import SafeAreaBox from './SafeAreaBox'
import FabButton from './FabButton'
import BlurBox from './BlurBox'
import TouchableOpacityBox from './TouchableOpacityBox'

type Props = {
  open: boolean
  onClose?: () => void
  actions: JSX.Element[]
}

const ActionSheet = ({ open, onClose, actions }: Props) => {
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])

  return (
    <AnimatePresence>
      <Portal>
        {open && (
          <FullWindowOverlay style={StyleSheet.absoluteFill}>
            <Box flex={1}>
              <MotiBox
                position="absolute"
                top={0}
                bottom={0}
                left={0}
                right={0}
                from={{ opacity: 0 }}
                animate={{ opacity: 0.95 }}
                exit={{ opacity: 0 }}
              >
                <BlurBox
                  position="absolute"
                  top={0}
                  bottom={0}
                  left={0}
                  right={0}
                />
              </MotiBox>
              <SafeAreaBox flex={1} justifyContent="flex-end">
                <TouchableOpacityBox
                  position="absolute"
                  top={0}
                  bottom={0}
                  left={0}
                  right={0}
                  onPress={handleClose}
                />
                {actions.map((action, index) => (
                  <ActionBox key={action.key} index={index}>
                    {action}
                  </ActionBox>
                ))}
                <Box alignItems="center" marginTop="l" marginBottom="m">
                  <FabButton
                    icon="close"
                    onPress={handleClose}
                    size={55}
                    iconColor="surfaceSecondaryText"
                    backgroundColor="surface"
                    backgroundColorOpacity={0.3}
                    backgroundColorOpacityPressed={0.4}
                  />
                </Box>
              </SafeAreaBox>
            </Box>
          </FullWindowOverlay>
        )}
      </Portal>
    </AnimatePresence>
  )
}

const ActionBox = ({
  index,
  children,
}: {
  index: number
  children: JSX.Element
}) => {
  return (
    <MotiBox
      transition={{ delay: index * 10, damping: 15 }}
      from={{
        opacity: 0,
        translateY: 0,
      }}
      animate={{
        opacity: 1,
        translateY: -70 * (index + 1) - 55,
      }}
      exit={{
        opacity: 0,
        translateY: 0,
      }}
      position="absolute"
      bottom={0}
      left={0}
      right={0}
    >
      {children}
    </MotiBox>
  )
}

export default ActionSheet
