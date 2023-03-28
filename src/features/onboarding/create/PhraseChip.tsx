/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, memo, useCallback } from 'react'
import { upperCase } from 'lodash'
import CheckMark from '@assets/images/checkmark.svg'
import Fail from '@assets/images/fail.svg'
import Text from '@components/Text'
import TouchableHighlightBox, {
  TouchableHighlightBoxProps,
} from '@components/TouchableHighlightBox'
import { useColors } from '@theme/themeHooks'
import Box from '@components/Box'
import { Color } from '@theme/theme'

type Props = Omit<TouchableHighlightBoxProps, 'children'> & {
  title: string
  selected?: boolean
  fail: boolean
  success: boolean
}

const PhraseChip = ({
  title,
  selected,
  fail,
  success,
  disabled,
  ...props
}: Props) => {
  const { surface, primary } = useColors()
  const [underlayShowing, setUnderlayShowing] = useState(false)

  const getBackgroundColor = useCallback((): Color => {
    if (fail) return 'error'
    if (success) return 'greenBright500'
    return 'transparent10'
  }, [fail, success])

  const getIcon = useCallback(() => {
    if (success) return <CheckMark color={primary} />

    if (fail) return <Fail color={primary} />

    return null
  }, [fail, primary, success])

  const handleUnderlayChange = useCallback(
    (val: boolean) => () => setUnderlayShowing(val),
    [],
  )

  return (
    <TouchableHighlightBox
      backgroundColor={getBackgroundColor()}
      borderRadius="lm"
      paddingVertical="s"
      maxWidth="30%"
      justifyContent="center"
      underlayColor={surface}
      disabled={selected || disabled}
      onHideUnderlay={handleUnderlayChange(false)}
      onShowUnderlay={handleUnderlayChange(true)}
      {...props}
    >
      <>
        <Box
          position="absolute"
          justifyContent="center"
          alignItems="center"
          top={0}
          left={0}
          right={0}
          bottom={0}
        >
          {getIcon()}
        </Box>
        <Text
          paddingHorizontal="m"
          numberOfLines={1}
          adjustsFontSizeToFit
          opacity={fail || success ? 0 : 1}
          variant="body0"
          color={
            selected || underlayShowing ? 'primaryText' : 'surfaceSecondaryText'
          }
        >
          {upperCase(title)}
        </Text>
      </>
    </TouchableHighlightBox>
  )
}

export default memo(PhraseChip)
