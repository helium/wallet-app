import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import IconPressedContainer from '@components/IconPressedContainer'
import Text from '@components/Text'
import { usePendingTransactions } from '@hooks/usePendingTransactions'
import React, { memo, useCallback } from 'react'

type Props = {
  onPress: () => void
}

const PendingTransactionsIcon = ({ onPress }: Props) => {
  const { pendingCount, isLoading } = usePendingTransactions()

  const handlePress = useCallback(() => {
    onPress()
  }, [onPress])

  // Don't show if no pending transactions
  if (!isLoading && pendingCount === 0) {
    return null
  }

  return (
    <Box position="relative">
      <IconPressedContainer onPress={handlePress}>
        {isLoading ? (
          <CircleLoader loaderSize={20} color="white" />
        ) : (
          <Box
            backgroundColor="blueBright500"
            borderRadius="round"
            width={24}
            height={24}
            justifyContent="center"
            alignItems="center"
          >
            <Text variant="body3" color="white" fontWeight="bold">
              {pendingCount > 9 ? '9+' : pendingCount}
            </Text>
          </Box>
        )}
      </IconPressedContainer>
      {!isLoading && pendingCount > 0 && (
        <Box
          position="absolute"
          top={-2}
          right={-2}
          backgroundColor="orange500"
          borderRadius="round"
          width={8}
          height={8}
        />
      )}
    </Box>
  )
}

export default memo(PendingTransactionsIcon)

