import { AccountIcon } from '@ui/AccountIcon'
import { Card } from '@ui/Card'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { Ellipsis } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { ellipsizeAddress } from '../../utils/accountUtils'

const MenuIcon = withUniwind(Ellipsis)

export type AddressActivityItemProps = {
  accountAddress: string
  showBubbleArrow?: boolean
  onMenuPress?: () => void
  className?: string
}

const AddressActivityItem = ({
  accountAddress,
  showBubbleArrow,
  onMenuPress,
  className,
}: AddressActivityItemProps) => {
  const { currentAccount } = useAccountStorage()
  const { t } = useTranslation()

  return (
    <>
      <Card
        variant="panel"
        className={twMerge('h-[70px] flex-row items-center py-0', className)}
      >
        <AccountIcon address={accountAddress} size={40} />
        <View className="ml-4 flex-1 justify-center">
          {currentAccount &&
            currentAccount.solanaAddress === accountAddress && (
              <Text size="lg" className="font-medium">
                {t('activityScreen.myAccount')}
              </Text>
            )}
          <Text className="text-muted-foreground">
            {ellipsizeAddress(accountAddress)}
          </Text>
        </View>
        <PressableScale
          onPress={onMenuPress}
          hitSlop={16}
          feedback="opacity"
          accessibilityLabel={t('collectablesScreen.transferActions')}
          className="p-2"
        >
          <MenuIcon size={16} colorClassName="accent-foreground" />
        </PressableScale>
      </Card>
      {showBubbleArrow && (
        <View className="h-[18px]">
          <View className="-m-3.5 size-[18px] rotate-45 self-center bg-secondary" />
        </View>
      )}
    </>
  )
}

export default AddressActivityItem
