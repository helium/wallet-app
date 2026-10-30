import { useAppStorage } from '@storage/AppStorageProvider'
import { useQuery } from '@tanstack/react-query'
import { getExplorers, Explorer } from '@utils/walletApiV2'
import { useMemo } from 'react'

export function useExplorer(): {
  current: Explorer | undefined
  explorers: Explorer[] | undefined
  loading: boolean
  updateExplorer: (nextExplorer: string) => Promise<void>
} {
  const { updateExplorer, explorer } = useAppStorage()
  // Randomize the order of items in the available array
  // to not bias explorers
  const { data: available, isLoading: loading } = useQuery({
    queryKey: ['explorers'],
    queryFn: async () => (await getExplorers()).sort(() => Math.random() - 0.5),
  })
  const current = useMemo(
    () => available?.find((a) => a.value === explorer),
    [available, explorer],
  )
  return {
    updateExplorer,
    explorers: available,
    current,
    loading,
  }
}

export function getExplorerUrl({
  entityKey,
  explorer,
}: {
  entityKey: string
  explorer: Explorer
}): string {
  return explorer.urlTemplate.replace('{{entityKey}}', entityKey)
}
