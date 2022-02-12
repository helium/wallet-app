import React, { memo, useCallback, useMemo } from 'react'
import DetailArrow from '@assets/images/detailArrow.svg'
import { Linking } from 'react-native'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { ellipsizeAddress } from '../../utils/accountUtils'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors, useHitSlop } from '../../theme/themeHooks'
import { Color } from '../../theme/theme'

type Props = {
  title: string
  bodyText: string | number
  icon?: Element
  isAddress?: boolean
  navTo?: string
  bodyColor?: Color
}
const TransactionLineItem = ({
  title,
  bodyText,
  icon,
  isAddress,
  navTo,
  bodyColor,
}: Props) => {
  const { primaryText } = useColors()
  const hitSlop = useHitSlop('xl')

  const body = useMemo(() => {
    if (typeof bodyText === 'number') {
      return bodyText.toLocaleString()
    }
    if (isAddress) {
      return ellipsizeAddress(bodyText)
    }
    return bodyText
  }, [bodyText, isAddress])

  const handleExplorerLink = useCallback(() => {
    if (!navTo) return

    Linking.openURL(navTo)
  }, [navTo])

  return (
    <Box
      borderBottomColor="surface"
      borderBottomWidth={1}
      paddingVertical="m"
      paddingHorizontal="l"
    >
      <Text variant="body2" color="secondaryText" marginBottom="xs">
        {title}
      </Text>
      <Box flexDirection="row">
        {icon}

        <Text
          flexShrink={1}
          variant="body1"
          color={bodyColor || 'primaryText'}
          selectable
          marginLeft={icon ? 'xs' : 'none'}
        >
          {body}
        </Text>
        {navTo && (
          <TouchableOpacityBox
            onPress={handleExplorerLink}
            hitSlop={hitSlop}
            paddingLeft="s"
          >
            <DetailArrow color={primaryText} />
          </TouchableOpacityBox>
        )}
      </Box>
    </Box>
  )
}

export default memo(TransactionLineItem)
