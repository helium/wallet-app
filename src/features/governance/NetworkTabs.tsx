import Box from '@components/Box'
import TokenPill from '@components/TokenPill'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useGovernance } from '@storage/GovernanceProvider'
import { GovMints } from '@utils/constants'
import React, { useRef } from 'react'
import { Animated } from 'react-native'
import { GovernanceNavigationProp } from './governanceTypes'

export const NetworkTabs: React.FC = () => {
  const navigation = useNavigation<GovernanceNavigationProp>()
  const { currentAccount } = useAccountStorage()
  const { mint, proposalCountByMint } = useGovernance()
  const anim = useRef(new Animated.Value(1))

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      paddingHorizontal="4"
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
              onPress={() => navigation.setParams({ mint: pk.toBase58() })}
              inactiveColor="secondaryBackground"
              activeColor="cardBackground"
            />
            {!mint.equals(pk) && hasUnseenProposals && (
              <Box
                flexDirection="row"
                alignItems="center"
                marginRight="2"
                position="absolute"
                top={-4}
                right={4}
              >
                <Box>
                  <Box
                    zIndex={2}
                    width={12}
                    height={12}
                    backgroundColor="orange.500"
                    borderRadius="full"
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
                        borderRadius="full"
                        width="100%"
                        height="100%"
                        backgroundColor="orange.500"
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
