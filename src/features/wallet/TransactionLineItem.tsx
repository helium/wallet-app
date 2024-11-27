import DetailArrow from '@assets/svgs/detailArrow.svg'
import AccountIcon from '@components/AccountIcon'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import useAlert from '@hooks/useAlert'
import useCopyText from '@hooks/useCopyText'
import { useNavigation } from '@react-navigation/native'
import { Color } from '@config/theme/theme'
import {
  useColors,
  useHitSlop,
  useVerticalHitSlop,
} from '@config/theme/themeHooks'
import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { ellipsizeAddress } from '../../utils/accountUtils'
import { locale } from '../../utils/i18n'
import { AddressBookNavigationProp } from '../addressBook/addressBookTypes'

type Props = {
  title: string
  bodyText: string | number
  bodyTextEnd?: string | number
  icon?: React.ReactNode
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
  const linkHitSlop = useHitSlop('2')
  const copyHitSlop = useVerticalHitSlop('2')
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
      borderBottomColor="cardBackground"
      borderBottomWidth={1}
      paddingVertical="4"
      paddingHorizontal="6"
    >
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        variant="textSmRegular"
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
            variant="textMdRegular"
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
            variant="textMdRegular"
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
              paddingLeft="2"
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
