import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'

// Holdings carry no metadata, so every row resolves its own: symbol, then name,
// then the shortened-mint fallback the classifier supplied. Shared by the token
// sheet and the review lines so both name a token the same way.
export const useTokenDisplay = (
  mint: string,
  fallbackLabel: string,
): { label: string; image?: string } => {
  const { json, symbol, name } = useMetaplexMetadata(usePublicKey(mint))

  return { label: symbol || name || fallbackLabel, image: json?.image }
}
