import { useAppStorage } from '@storage/AppStorageProvider'
import { getExplorers, Explorer } from '@utils/walletApiV2'
import { useMemo } from 'react'
import { useAsync } from 'react-async-hook'

export function useExplorer(): {
  current: Explorer | undefined
  explorers: Explorer[] | undefined
  loading: boolean
  updateExplorer: (nextExplorer: string) => Promise<void>
} {
  const { updateExplorer, explorer } = useAppStorage()
  const { result: available, loading } = useAsync(getExplorers, [])
  const current = useMemo(
    () => available?.find((a) => a.value === explorer),
    [available, explorer],
  )
  // Randomize the order of items in the available array
  // to not bias explorers
  const randomizedAvailable = useMemo(() => {
    return available?.sort(() => Math.random() - 0.5)
  }, [available])
  return {
    updateExplorer,
    explorers: randomizedAvailable,
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
