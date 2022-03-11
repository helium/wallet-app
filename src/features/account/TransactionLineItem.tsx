import React, { memo, useCallback, useMemo } from 'react'
import DetailArrow from '@assets/images/detailArrow.svg'
import { Linking } from 'react-native'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { ellipsizeAddress } from '../../utils/accountUtils'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import {
  useColors,
  useHitSlop,
  useVerticalHitSlop,
} from '../../theme/themeHooks'
import { Color } from '../../theme/theme'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import useCopyAddress from '../../utils/useCopyAddress'

type Props = {
  title: string
  bodyText: string | number
  bodyTextEnd?: string | number
  icon?: Element
  isAddress?: boolean
  navTo?: string
  bodyColor?: Color
  bodyEndColor?: Color
}
const TransactionLineItem = ({
  title,
  bodyText,
  bodyTextEnd,
  icon,
  isAddress,
  navTo,
  bodyColor,
  bodyEndColor,
}: Props) => {
  const { primaryText } = useColors()
  const linkHitSlop = useHitSlop('s')
  const copyHitSlop = useVerticalHitSlop('s')
  const { contacts } = useAccountStorage()
  const copyAddress = useCopyAddress()

  const handleCopy = useCallback(
    (address: string | number) => () => {
      const addressToCopy = `${address}`
      if (!addressToCopy) return

      copyAddress(addressToCopy)
    },
    [copyAddress],
  )

  const aliasForContact = useCallback(
    (address) => {
      const contact = contacts.find((c) => c.address === address)
      return contact?.alias
    },
    [contacts],
  )

  const body = useMemo(() => {
    if (typeof bodyText === 'number') {
      return bodyText.toLocaleString()
    }
    if (isAddress) {
      const alias = aliasForContact(bodyText)
      return alias || ellipsizeAddress(bodyText)
    }
    return bodyText
  }, [aliasForContact, bodyText, isAddress])

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
      <Box flexDirection="row" alignItems="center">
        {icon}

        <TouchableOpacityBox
          hitSlop={copyHitSlop}
          onPress={handleCopy(bodyText)}
          disabled={!isAddress}
          minWidth={30}
        >
          <Text
            flexShrink={1}
            variant="body1"
            color={bodyColor || 'primaryText'}
            marginLeft={icon ? 'xs' : 'none'}
          >
            {body}
          </Text>
        </TouchableOpacityBox>

        {bodyTextEnd && (
          <Text
            flex={1}
            textAlign="right"
            variant="body1"
            color={bodyEndColor || 'primaryText'}
            marginLeft={icon ? 'xs' : 'none'}
          >
            {bodyTextEnd}
          </Text>
        )}
        {navTo && (
          <TouchableOpacityBox
            onPress={handleExplorerLink}
            hitSlop={linkHitSlop}
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
