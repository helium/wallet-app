import useCopyText from '@hooks/useCopyText'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { ellipsizeAddress } from '@utils/accountUtils'
import { Copy } from 'lucide-react-native'
import React from 'react'
import { withUniwind } from 'uniwind'

const CopyIcon = withUniwind(Copy)

// The current account's address in a pill. Pressing it copies the address.
const CopyAddressPill = () => {
  const copyText = useCopyText({ haptic: false })
  const { currentAccount } = useAccountStorage()

  const handleCopyAddress = () => {
    if (!currentAccount?.solanaAddress) return
    copyText({
      message: ellipsizeAddress(currentAccount.solanaAddress),
      copyText: currentAccount.solanaAddress,
    })
  }

  return (
    <PressableScale
      onPress={handleCopyAddress}
      className="mb-6 flex-row items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2"
    >
      <Text
        className="text-center text-muted-foreground"
        numberOfLines={1}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.2}
      >
        {ellipsizeAddress(currentAccount?.solanaAddress || '', {
          numChars: 6,
        })}
      </Text>
      <CopyIcon size={16} colorClassName="accent-muted-foreground" />
    </PressableScale>
  )
}

export default CopyAddressPill
