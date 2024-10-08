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
  const { cardBackground, primaryText } = useColors()
  const [underlayShowing, setUnderlayShowing] = useState(false)

  const getBackgroundColor = useCallback((): Color => {
    if (fail) return 'error.500'
    if (success) return 'green.light-500'
    return 'transparent10'
  }, [fail, success])

  const getIcon = useCallback(() => {
    if (success) return <CheckMark color={primaryText} />

    if (fail) return <Fail color={primaryText} />

    return null
  }, [fail, primaryText, success])

  const handleUnderlayChange = useCallback(
    (val: boolean) => () => setUnderlayShowing(val),
    [],
  )

  return (
    <TouchableHighlightBox
      backgroundColor={getBackgroundColor()}
      borderRadius="2xl"
      paddingVertical="2"
      maxWidth="30%"
      justifyContent="center"
      underlayColor={cardBackground}
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
          paddingHorizontal="4"
          numberOfLines={1}
          adjustsFontSizeToFit
          opacity={fail || success ? 0 : 1}
          variant="textXlRegular"
          color={selected || underlayShowing ? 'primaryText' : 'secondaryText'}
        >
          {upperCase(title)}
        </Text>
      </>
    </TouchableHighlightBox>
  )
}

export default memo(PhraseChip)
