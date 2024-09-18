import BrowseVoters from '@assets/images/browseVoters.svg'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import SearchInput from '@components/SearchInput'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import { proxiesQuery } from '@helium/voter-stake-registry-hooks'
import { EnhancedProxy } from '@helium/voter-stake-registry-sdk'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { useInfiniteQuery } from '@tanstack/react-query'
import { shortenAddress } from '@utils/formatting'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { useDebounce } from 'use-debounce'
import { GovernanceNavigationProp } from './governanceTypes'

export const ProxySearch: React.FC<{
  value: string
  disabled?: boolean
  onValueChange: (value: string) => void
}> = ({ value, onValueChange, disabled }) => {
  const [input, setInput] = useState<string>(value)
  const [focused, setFocused] = useState(false)
  const [debouncedInput] = useDebounce(input, 300)
  const { voteService, mint } = useGovernance()
  const {
    data: resultPaged,
    isLoading: loading,
    isPending,
  } = useInfiniteQuery<EnhancedProxy>(
    proxiesQuery({
      search: debouncedInput || '',
      amountPerPage: 20,
      voteService,
    }),
  )

  const result = useMemo(() => {
    const resultsAsOptions =
      resultPaged?.pages.flat().map((r) => {
        return {
          value: r.wallet,
          label: `${r.name} | ${shortenAddress(r.wallet)}`,
        }
      }) || []
    if (isValidPublicKey(debouncedInput)) {
      resultsAsOptions.push({
        value: debouncedInput || '',
        label: debouncedInput || '',
      })
    }
    return resultsAsOptions
  }, [resultPaged, debouncedInput])

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: { value: string; label: string } }) => {
      return (
        <TouchableContainer
          backgroundColor="bg.tertiary"
          p="4"
          mt="2"
          onPress={() => {
            onValueChange(item.value)
            setInput(item.value)
            setFocused(false)
          }}
        >
          <Text variant="textXsRegular" color="primaryText">
            {item.label}
          </Text>
        </TouchableContainer>
      )
    },
    [onValueChange],
  )
  const ListEmptyComponent = useCallback(() => {
    if (loading || isPending) {
      return <CircleLoader />
    }

    return null
  }, [loading, isPending])

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

  const navigation = useNavigation<GovernanceNavigationProp>()
  const handleBrowseVoters = useCallback(() => {
    navigation.navigate('VotersScreen', {
      mint: mint.toBase58(),
    })
  }, [navigation, mint])

  return (
    <FlatList
      data={focused ? result || [] : []}
      renderItem={renderItem}
      ListHeaderComponent={
        <>
          <Text variant="textXsRegular" color="secondaryText" mb="xs">
            {selected ? selected.label : t('gov.assignProxy.searchPlaceholder')}
          </Text>
          <Box flexDirection="row" alignItems="center">
            <SearchInput
              flex={1}
              value={input}
              onChangeText={handleInputChange}
              placeholder={t('gov.assignProxy.searchPlaceholder')}
              textInputProps={{
                onFocus: () => setFocused(true),
                onBlur: () => setFocused(false),
                editable: !disabled,
              }}
            />
            <ButtonPressable
              backgroundColor="secondaryBackground"
              Icon={BrowseVoters}
              borderRadius="2xl"
              ml="2"
              onPress={handleBrowseVoters}
              padding="2"
              height={52}
              innerContainerProps={{ px: '4' }}
            />
          </Box>
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
