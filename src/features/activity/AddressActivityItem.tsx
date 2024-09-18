import React from 'react'
import { StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { BoxProps } from '@shopify/restyle'
import Menu from '@assets/images/menu.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import { useColors } from '@theme/themeHooks'
import AccountIcon from '@components/AccountIcon'
import { Theme } from '@theme/theme'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { ellipsizeAddress } from '../../utils/accountUtils'

export const LIST_ITEM_HEIGHT = 70
export type AddressActivityItemProps = {
  accountAddress: string
  showBubbleArrow?: boolean
  onMenuPress?: () => void
} & BoxProps<Theme>

const AddressActivityItem = ({
  accountAddress,
  showBubbleArrow,
  onMenuPress,
  ...rest
}: AddressActivityItemProps) => {
  const colors = useColors()
  const { currentAccount } = useAccountStorage()
  const { t } = useTranslation()

  return (
    <>
      <Box
        backgroundColor="gray.950"
        alignItems="center"
        flexDirection="row"
        height={LIST_ITEM_HEIGHT}
        {...rest}
        paddingStart="4"
      >
        <AccountIcon address={accountAddress} size={40} />
        <Box flexGrow={1} justifyContent="center" marginStart="4">
          {currentAccount &&
            currentAccount.solanaAddress === accountAddress && (
              <Text variant="textLgMedium">
                {t('activityScreen.myAccount')}
              </Text>
            )}
          <Text color="secondaryText">{ellipsizeAddress(accountAddress)}</Text>
        </Box>
        <TouchableOpacityBox padding="6" onPress={onMenuPress}>
          <Menu color={colors['base.white']} width={14} />
        </TouchableOpacityBox>
      </Box>
      {showBubbleArrow && (
        <Box height={18}>
          <Box
            backgroundColor="gray.950"
            alignSelf="center"
            style={styles.rotatedBox}
          />
        </Box>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  rotatedBox: {
    height: 18,
    width: 18,
    margin: -14,
    transform: [{ rotate: '45deg' }],
  },
})

export default AddressActivityItem
