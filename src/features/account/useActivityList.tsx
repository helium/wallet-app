import { FilterType } from './AccountActivityFilter'
import { CSAccount } from '../../storage/cloudStorage'
import useHeliumActivityList from './useHeliumActivityList'
import useSolanaActivityList from './useSolanaActivityList'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { TokenType } from '../../types/activity'

export default (props: {
  account?: CSAccount | null
  filter: FilterType
  tokenType: TokenType
}) => {
  const { l1Network } = useAppStorage()
  // TODO: Add a skip option to each list type
  const heliumActivity = useHeliumActivityList(props)
  const solanaActivity = useSolanaActivityList(props)

  if (l1Network === 'solana_dev') return solanaActivity

  return heliumActivity
}
