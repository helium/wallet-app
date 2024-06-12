import Box from '@components/Box'
import TokenPill from '@components/TokenPill'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useGovernance } from '@storage/GovernanceProvider'
import { GovMints } from '@utils/constants'
import React, { useRef } from 'react'
import { Animated } from 'react-native'

export const NetworkTabs: React.FC = () => {
  const { currentAccount } = useAccountStorage()
  const { mint, setMint, proposalCountByMint } = useGovernance()
  const anim = useRef(new Animated.Value(1))

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      paddingHorizontal="m"
    >
      {GovMints.map((m) => {
        const pk = new PublicKey(m)
        const hasUnseenProposals =
          (proposalCountByMint?.[m] || 0) >
          (currentAccount?.proposalCountByMint?.[m] || 0)

        return (
          <Box key={m} position="relative">
            <TokenPill
              mint={pk}
              isActive={mint.equals(pk)}
              onPress={() => setMint(pk)}
              inactiveColor="secondaryBackground"
              activeColor="secondary"
            />
            {!mint.equals(pk) && hasUnseenProposals && (
              <Box
                flexDirection="row"
                alignItems="center"
                marginRight="s"
                position="absolute"
                top={-4}
                right={4}
              >
                <Box>
                  <Box
                    zIndex={2}
                    width={12}
                    height={12}
                    backgroundColor="flamenco"
                    borderRadius="round"
                  />
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                  >
                    <Animated.View
                      style={{ transform: [{ scale: anim.current }] }}
                    >
                      <Box
                        opacity={0.3}
                        borderRadius="round"
                        width="100%"
                        height="100%"
                        backgroundColor="flamenco"
                      />
                    </Animated.View>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
