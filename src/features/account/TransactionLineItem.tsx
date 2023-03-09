import React, { memo, useCallback, useMemo } from 'react'
import DetailArrow from '@assets/images/detailArrow.svg'
import { Linking } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors, useHitSlop, useVerticalHitSlop } from '@theme/themeHooks'
import { Color } from '@theme/theme'
import useCopyText from '@hooks/useCopyText'
import useAlert from '@hooks/useAlert'
import AccountIcon from '@components/AccountIcon'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { AddressBookNavigationProp } from '../addressBook/addressBookTypes'
import { locale } from '../../utils/i18n'
import { ellipsizeAddress } from '../../utils/accountUtils'

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
  const { contacts, sortedAccounts } = useAccountStorage()
  const copyText = useCopyText()
  const navigation = useNavigation<AddressBookNavigationProp>()
  const { showOKCancelAlert } = useAlert()
  const { t } = useTranslation()

  const handleCopy = useCallback(
    (address: string | number) => () => {
      if (isAddress) {
        const addressToCopy = `${address}`
        if (!addressToCopy) return
        copyText({
          message: ellipsizeAddress(addressToCopy),
          copyText: addressToCopy,
        })
      } else if (navTo) {
        copyText({
          copyText: navTo,
          message: 'url',
        })
      }
    },
    [copyText, isAddress, navTo],
  )

  const account = useCallback(
    (address) => {
      const contact = contacts.find(
        (c) => c.address === address || c.solanaAddress === address,
      )
      if (contact) return contact
      return sortedAccounts.find(
        (c) => c.address === address || c.solanaAddress === address,
      )
    },
    [contacts, sortedAccounts],
  )

  const body = useMemo(() => {
    if (typeof bodyText === 'number') {
      return bodyText.toLocaleString(locale)
    }
    if (isAddress) {
      const alias = account(bodyText)?.alias
      return alias || ellipsizeAddress(bodyText)
    }
    return bodyText
  }, [account, bodyText, isAddress])

  const handleLongPress = useCallback(
    (address: string | number) => async () => {
      if (!isAddress) return
      const addressToCopy = `${address}`
      if (!addressToCopy || account(addressToCopy)?.alias) return

      const decision = await showOKCancelAlert({
        title: t('transactions.addToAddressBook.title'),
        message: t('transactions.addToAddressBook.message'),
      })
      if (!decision) return

      navigation.navigate('AddNewContact', { address: addressToCopy })
    },
    [account, isAddress, navigation, showOKCancelAlert, t],
  )

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
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        variant="body2"
        color="secondaryText"
        marginBottom="xs"
      >
        {title}
      </Text>
      <Box flexDirection="row" alignItems="center">
        {icon}

        <TouchableOpacityBox
          hitSlop={copyHitSlop}
          onPress={handleCopy(bodyText)}
          onLongPress={handleLongPress(bodyText)}
          disabled={!isAddress && !navTo}
          minWidth={30}
          maxWidth="90%"
          flexDirection="row"
        >
          {isAddress && typeof bodyText === 'string' && (
            <Box marginRight="xs" justifyContent="center">
              <AccountIcon size={16} address={bodyText} />
            </Box>
          )}
          <Text
            numberOfLines={3}
            adjustsFontSizeToFit
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
            numberOfLines={2}
            adjustsFontSizeToFit
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
          <Box
            flex={1}
            width="100%"
            flexDirection="row"
            justifyContent="flex-end"
          >
            <TouchableOpacityBox
              onPress={handleExplorerLink}
              hitSlop={linkHitSlop}
              paddingLeft="s"
            >
              <DetailArrow color={primaryText} />
            </TouchableOpacityBox>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default memo(TransactionLineItem)
