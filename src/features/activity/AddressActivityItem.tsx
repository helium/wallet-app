import React from 'react'
import { StyleSheet } from 'react-native'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { useColors } from '../../theme/themeHooks'
import TouchableOpacityBox, {
  TouchableOpacityBoxProps,
} from '../../components/TouchableOpacityBox'
import AccountIcon from '../../components/AccountIcon'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import Menu from '../../assets/images/menu.svg'
import { ellipsizeAddress } from '../../utils/accountUtils'

export const LIST_ITEM_HEIGHT = 70
export type AddressActivityItemProps = {
  accountAddress: string
  showBubbleArrow?: boolean
  onMenuPress?: () => void
} & TouchableOpacityBoxProps

const AddressActivityItem = ({
  accountAddress,
  showBubbleArrow,
  onMenuPress,
  ...rest
}: AddressActivityItemProps) => {
  const colors = useColors()
  const { currentAccount } = useAccountStorage()

  return (
    <Box>
      <Box
        backgroundColor="black700"
        alignItems="center"
        flex={1}
        flexDirection="row"
        height={LIST_ITEM_HEIGHT}
        {...rest}
        paddingStart="m"
      >
        <AccountIcon address={accountAddress} size={40} />
        <Box flexGrow={1} justifyContent="center" marginStart="m">
          {currentAccount &&
            currentAccount.solanaAddress === accountAddress && (
              <Text variant="subtitle2">My Account</Text>
            )}
          <Text color="secondaryText">{ellipsizeAddress(accountAddress)}</Text>
        </Box>
        <TouchableOpacityBox padding="l" onPress={onMenuPress}>
          <Menu color={colors.white} width={14} />
        </TouchableOpacityBox>
      </Box>
      {showBubbleArrow && (
        <Box height={18}>
          <Box
            backgroundColor="black700"
            alignSelf="center"
            style={styles.rotatedBox}
          />
        </Box>
      )}
    </Box>
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
