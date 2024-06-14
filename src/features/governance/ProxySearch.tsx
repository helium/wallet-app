import CircleLoader from '@components/CircleLoader'
import SearchInput from '@components/SearchInput'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import { useHeliumVsrState } from '@helium/voter-stake-registry-hooks'
import { PublicKey } from '@solana/web3.js'
import { debounce } from '@utils/debounce'
import { shortenAddress } from '@utils/formatting'
import React, { useCallback, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'

export const ProxySearch: React.FC<{
  value: string
  onValueChange: (value: string) => void
}> = ({ value, onValueChange }) => {
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState<string>(value)
  const { voteService } = useHeliumVsrState()
  const [focused, setFocused] = useState(false)

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string | undefined) => {
        setLoading(true)
        try {
          const results = await voteService?.searchProxies({
            query: query || '',
          })

          const resultsAsOptions =
            results?.map((r: any) => {
              return {
                value: r.wallet,
                label: `${r.name} | ${shortenAddress(r.wallet)}`,
              }
            }) || []

          if (
            isValidPublicKey(query) &&
            !resultsAsOptions.some((r: { value: string }) => r.value === query)
          ) {
            resultsAsOptions.push({
              value: query || '',
              label: query || '',
            })
          }

          return resultsAsOptions
        } finally {
          setLoading(false)
        }
      }, 300),
    [voteService],
  )

  const { result } = useAsync(debouncedSearch, [input])
  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: { value: string; label: string } }) => {
      return (
        <TouchableContainer
          backgroundColor="surfaceSecondary"
          p="m"
          mt="s"
          onPress={() => {
            onValueChange(item.value)
            setInput(item.value)
            setFocused(false)
          }}
        >
          <Text variant="body3" color="white">
            {item.label}
          </Text>
        </TouchableContainer>
      )
    },
    [onValueChange],
  )
  const ListEmptyComponent = useCallback(() => {
    if (loading) {
      return <CircleLoader />
    }

    return null
  }, [loading])

  const selected = useMemo(() => {
    return result?.find((r: { value: string }) => r.value === input)
  }, [input, result])
  const { t } = useTranslation()

  const handleInputChange = useCallback(
    (v: string) => {
      if (!focused) {
        setFocused(true)
      }

      setInput(v)
    },
    [focused],
  )

  return (
    <FlatList
      data={focused ? result || [] : []}
      renderItem={renderItem}
      ListHeaderComponent={
        <>
          <Text variant="body3" color="secondaryText">
            {selected ? selected.label : t('gov.assignProxy.searchPlaceholder')}
          </Text>
          <SearchInput
            value={input}
            onChangeText={handleInputChange}
            placeholder={t('gov.assignProxy.searchPlaceholder')}
            textInputProps={{
              onFocus: () => setFocused(true),
              onBlur: () => setFocused(false),
            }}
          />
        </>
      }
      ListEmptyComponent={ListEmptyComponent}
    />
  )
}

function isValidPublicKey(input: string | undefined) {
  try {
    // eslint-disable-next-line no-new
    new PublicKey(input || '')
    return true
  } catch (e) {
    return false
  }
}
