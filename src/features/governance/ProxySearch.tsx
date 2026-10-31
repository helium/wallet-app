import SearchInput from '@components/SearchInput'
import { proxiesQuery } from '@helium/voter-stake-registry-hooks'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { shortenAddress } from '@utils/formatting'
import { Users } from 'lucide-react-native'
import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, TextInput, View, useWindowDimensions } from 'react-native'
import { useKeyboard } from '@react-native-community/hooks'
import { withUniwind } from 'uniwind'
import { useDebounce } from 'use-debounce'
import { GovernanceNavigationProp } from './governanceTypes'

const UsersIcon = withUniwind(Users)

export const ProxySearch = React.forwardRef<
  TextInput,
  {
    value: string
    disabled?: boolean
    onValueChange: (value: string) => void
  }
>(({ value, onValueChange, disabled }, ref) => {
  const [input, setInput] = useState<string>(value)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)
  const isSelectingFromDropdown = useRef(false)
  const isScrolling = useRef(false)

  useImperativeHandle(ref, () => inputRef.current as TextInput, [])
  React.useEffect(() => {
    if (value !== input && !focused) {
      setInput(value)
    }
  }, [value, input, focused])

  const [debouncedInput] = useDebounce(input, 300)
  const { voteService, mint } = useGovernance()
  const {
    data: resultPaged,
    isLoading: loading,
    isPending,
  } = useInfiniteQuery(
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
    ({ item }: { item: { value: string; label: string } }) => {
      return (
        <PressableScale
          feedback="opacity"
          className="mt-2 rounded-[12px] bg-secondary p-4"
          onPress={() => {
            isSelectingFromDropdown.current = true
            setInput(item.value)
            onValueChange(item.value)
            setFocused(false)
            // Blur the input to dismiss keyboard when proxy is selected
            inputRef.current?.blur()
          }}
        >
          <Text>{item.label}</Text>
        </PressableScale>
      )
    },
    [onValueChange],
  )
  const ListEmptyComponent = useCallback(() => {
    if (loading || isPending) {
      return <Spinner />
    }

    return null
  }, [loading, isPending])

  const selected = useMemo(() => {
    return result?.find((r: { value: string }) => r.value === input)
  }, [input, result])

  const { t } = useTranslation()

  const handleInputChange = useCallback(
    (v: string) => {
      if (isSelectingFromDropdown.current) {
        isSelectingFromDropdown.current = false
        return
      }

      if (!focused) {
        setFocused(true)
      }

      setInput(v)

      if (isValidPublicKey(v)) {
        onValueChange(v)
      } else {
        onValueChange('')
      }
    },
    [focused, onValueChange],
  )

  const navigation = useNavigation<GovernanceNavigationProp>()
  const handleBrowseVoters = useCallback(() => {
    navigation.navigate(
      'ProxiesScreen',
      { mint: mint.toBase58() },
      { pop: true },
    )
  }, [navigation, mint])

  const keyboard = useKeyboard()
  const { height: screenHeight } = useWindowDimensions()
  const maxListHeight = useMemo(() => {
    const availableHeight = screenHeight - keyboard.keyboardHeight
    return Math.max(150, Math.min(340, availableHeight))
  }, [keyboard.keyboardHeight, screenHeight])

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      data={focused ? result || [] : []}
      renderItem={renderItem}
      style={{ maxHeight: maxListHeight }}
      nestedScrollEnabled
      onScrollBeginDrag={() => {
        isScrolling.current = true
      }}
      onScrollEndDrag={() => {
        setTimeout(() => {
          isScrolling.current = false
        }, 50)
      }}
      onMomentumScrollEnd={() => {
        isScrolling.current = false
      }}
      ListHeaderComponent={
        <>
          <Text className="mb-1 text-muted-foreground">
            {selected ? selected.label : t('gov.assignProxy.searchPlaceholder')}
          </Text>
          <View className="flex-row items-center">
            <SearchInput
              ref={inputRef}
              flex={1}
              value={input}
              onChangeText={handleInputChange}
              placeholder={t('gov.assignProxy.searchPlaceholder')}
              textInputProps={{
                onFocus: () => setFocused(true),
                onBlur: () => {
                  if (!isScrolling.current) {
                    setFocused(false)
                  }
                },
                editable: !disabled,
              }}
            />
            <Button
              variant="secondary"
              className="ml-2 h-[52px] rounded-[12px] px-4"
              accessibilityLabel={t('gov.assignProxy.browseProxies')}
              onPress={handleBrowseVoters}
            >
              <UsersIcon size={20} colorClassName="accent-foreground" />
            </Button>
          </View>
        </>
      }
      ListEmptyComponent={ListEmptyComponent}
    />
  )
})

function isValidPublicKey(input: string | undefined) {
  try {
    // eslint-disable-next-line no-new
    new PublicKey(input || '')
    return true
  } catch {
    return false
  }
}
