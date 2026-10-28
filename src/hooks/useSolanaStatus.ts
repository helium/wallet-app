import { useQuery } from '@tanstack/react-query'

export type SolanaStatusResponse = {
  migrationStatus: 'not_started' | 'in_progress' | 'complete'
  minimumVersions: Record<string, string>
  treasuryWarning: boolean
  finalBlockHeight?: number
}

export const fetchSolanaStatus = async (): Promise<SolanaStatusResponse> => {
  const response = await fetch('https://solana-status.helium.com/')
  if (!response.ok) {
    throw new Error(`Solana status request failed: ${response.status}`)
  }
  return response.json()
}

export const parseSolanaStatus = (status?: SolanaStatusResponse) => {
  if (!status?.migrationStatus) {
    return {
      migrationStatus: 'complete',
      minimumVersions: {
        'com.helium.wallet.app': '2.0.0',
      } as Record<string, string>,
      treasuryWarning: true,
    }
  }
  return status
}

export const useSolanaStatus = () =>
  useQuery({ queryKey: ['solanaStatus'], queryFn: fetchSolanaStatus })
