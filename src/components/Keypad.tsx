import React, { memo, useCallback } from 'react'
import { BoxProps } from '@shopify/restyle'
import useHaptic from '@hooks/useHaptic'
import { Theme } from '@theme/theme'
import Box from './Box'
import KeypadButton, { KeypadCustomInput, KeypadInput } from './KeypadButton'

type Props = {
  onPress?: (value?: KeypadInput) => void
  customButtonType?: KeypadCustomInput
} & BoxProps<Theme>

const Keypad = ({ onPress, customButtonType, ...boxProps }: Props) => {
  const { triggerImpact } = useHaptic()

  const handlePress = useCallback(
    (value?: KeypadInput) => {
      onPress?.(value)
      triggerImpact()
    },
    [onPress, triggerImpact],
  )

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Box flex={1} {...boxProps}>
      <Box flex={1} flexDirection="row">
        {[...Array(3).keys()].map((idx) => (
          <KeypadButton value={idx + 1} onPress={handlePress} key={idx + 1} />
        ))}
      </Box>
      <Box flex={1} flexDirection="row">
        {[...Array(3).keys()].map((idx) => (
          <KeypadButton value={idx + 4} onPress={handlePress} key={idx + 4} />
        ))}
      </Box>
      <Box flex={1} flexDirection="row">
        {[...Array(3).keys()].map((idx) => (
          <KeypadButton value={idx + 7} onPress={handlePress} key={idx + 7} />
        ))}
      </Box>
      <Box flex={1} flexDirection="row">
        <KeypadButton value={customButtonType} onPress={handlePress} />
        <KeypadButton value={0} onPress={handlePress} />
        <KeypadButton value="backspace" onPress={handlePress} />
      </Box>
    </Box>
  )
}

export default memo(Keypad)
