/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, memo } from 'react'
import { upperCase } from 'lodash'
import CheckMark from '@assets/images/checkmark.svg'
import Fail from '@assets/images/fail.svg'
import Text from '../../../components/Text'
import TouchableHighlightBox, {
  TouchableHighlightBoxProps,
} from '../../../components/TouchableHighlightBox'
import { useColors } from '../../../theme/themeHooks'
import Box from '../../../components/Box'

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
  const { surface } = useColors()
  const [underlayShowing, setUnderlayShowing] = useState(false)

  const getBackgroundColor = () => {
    if (fail) return 'error'
    if (success) return 'purple500'
    return 'surfaceContrast'
  }

  const getIcon = () => {
    if (success) return <CheckMark color="white" />

    if (fail) return <Fail />

    return null
  }

  return (
    <TouchableHighlightBox
      backgroundColor={getBackgroundColor()}
      borderRadius="l"
      paddingVertical="m"
      maxWidth="30%"
      justifyContent="center"
      underlayColor={surface}
      disabled={selected || disabled}
      onHideUnderlay={() => setUnderlayShowing(false)}
      onShowUnderlay={() => setUnderlayShowing(true)}
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
          variant="body1"
          color={
            selected || underlayShowing ? 'surfaceText' : 'surfaceContrastText'
          }
        >
          {upperCase(title)}
        </Text>
      </>
    </TouchableHighlightBox>
  )
}

export default memo(PhraseChip)
