import { useNavigation } from '@react-navigation/native'
import { useGovernance } from '@storage/GovernanceProvider'
import { useCallback } from 'react'
import { GovernanceNavigationProp } from './governanceTypes'

export function useSetTab() {
  const { mint } = useGovernance()
  const navigation = useNavigation<GovernanceNavigationProp>()

  return useCallback(
    (tab: string) => {
      switch (tab) {
        case 'proposals':
          navigation.navigate('ProposalsScreen', {
            mint: mint.toBase58(),
          })
          break
        case 'positions':
          navigation.navigate('PositionsScreen', {
            mint: mint.toBase58(),
          })
          break
        case 'proxies':
          navigation.navigate('ProxiesScreen', {
            mint: mint.toBase58(),
          })
          break
        default:
          break
      }
    },
    [navigation, mint],
  )
}
