import useAlert from '@hooks/useAlert'
import useCopyText from '@hooks/useCopyText'
import { useNavigation } from '@react-navigation/native'
import { AccountIcon } from '@ui/AccountIcon'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { ChevronRight } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, View } from 'react-native'
import { withUniwind } from 'uniwind'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { ellipsizeAddress } from '../../utils/accountUtils'
import { locale } from '../../utils/i18n'
import { AddressBookNavigationProp } from '../addressBook/addressBookTypes'

const DetailIcon = withUniwind(ChevronRight)

type Props = {
  title: string
  bodyText: string | number
  bodyTextEnd?: string | number
  icon?: React.ReactNode
  isAddress?: boolean
  navTo?: string
  // Text colour classes, `text-foreground` by default
  bodyColor?: string
  bodyEndColor?: string
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
  const { contacts, sortedAccounts } = useAccountStorage()
  const copyText = useCopyText()
  const navigation = useNavigation<AddressBookNavigationProp>()
  const { showOKCancelAlert } = useAlert()
  const { t } = useTranslation()

  const handleCopy = (address: string | number) => () => {
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
  }

  const account = (address: string) => {
    const contact = contacts.find(
      (c) => c.address === address || c.solanaAddress === address,
    )
    if (contact) return contact
    return sortedAccounts.find(
      (c) => c.address === address || c.solanaAddress === address,
    )
  }

  let body: string
  if (typeof bodyText === 'number') {
    body = bodyText.toLocaleString(locale)
  } else if (isAddress) {
    body = account(bodyText)?.alias || ellipsizeAddress(bodyText)
  } else {
    body = bodyText
  }

  const handleLongPress = (address: string | number) => async () => {
    if (!isAddress) return
    const addressToCopy = `${address}`
    if (!addressToCopy || account(addressToCopy)?.alias) return

    const decision = await showOKCancelAlert({
      title: t('transactions.addToAddressBook.title'),
      message: t('transactions.addToAddressBook.message'),
    })
    if (!decision) return

    navigation.navigate('AddNewContact', { address: addressToCopy })
  }

  const handleExplorerLink = () => {
    if (!navTo) return

    void Linking.openURL(navTo)
  }

  return (
    <View className="border-b border-border px-6 py-4">
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        className="mb-1 text-muted-foreground"
      >
        {title}
      </Text>
      <View className="flex-row items-center">
        {icon}

        <PressableScale
          feedback="opacity"
          hitSlop={{ top: 8, bottom: 8 }}
          onPress={handleCopy(bodyText)}
          onLongPress={() =>
            void handleLongPress(bodyText)().catch(console.error)
          }
          disabled={!isAddress && !navTo}
          className="min-w-[30px] max-w-[90%] flex-row"
        >
          {isAddress && typeof bodyText === 'string' && (
            <View className="mr-1 justify-center">
              <AccountIcon size={16} address={bodyText} />
            </View>
          )}
          <Text
            numberOfLines={3}
            adjustsFontSizeToFit
            size="base"
            className={twMerge('shrink', icon && 'ml-1', bodyColor)}
          >
            {body}
          </Text>
        </PressableScale>

        {bodyTextEnd && (
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            size="base"
            className={twMerge(
              'flex-1 text-right',
              icon && 'ml-1',
              bodyEndColor,
            )}
          >
            {bodyTextEnd}
          </Text>
        )}
        {navTo && (
          <View className="w-full flex-1 flex-row justify-end">
            <PressableScale
              feedback="opacity"
              hitSlop={8}
              onPress={handleExplorerLink}
              className="pl-2"
            >
              <DetailIcon size={20} colorClassName="accent-foreground" />
            </PressableScale>
          </View>
        )}
      </View>
    </View>
  )
}

export default TransactionLineItem
