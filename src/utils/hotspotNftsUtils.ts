import { Program, setProvider } from '@coral-xyz/anchor'
import { LazyDistributor } from '@helium/idls/lib/types/lazy_distributor'
import { init } from '@helium/lazy-distributor-sdk'
import { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useAccountStorage } from '../storage/AccountStorageProvider'

export function useProgram() {
  const [program, setProgram] = useState<Program<LazyDistributor> | null>(null)
  const { anchorProvider } = useAccountStorage()
  useAsync(async () => {
    if (!anchorProvider) return
    setProvider(anchorProvider)

    const p = await init(anchorProvider)
    setProgram((prog) => prog || (p as unknown as Program<LazyDistributor>))
  }, [anchorProvider])

  return program
}

export const removeDashAndCapitalize = (str: string) => {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
}
