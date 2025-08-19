import BrowseProxies from '@assets/images/browseProxies.svg'
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
import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, FlatList, TextInput } from 'react-native'
import { useKeyboard } from '@react-native-community/hooks'
import { useDebounce } from 'use-debounce'
import { GovernanceNavigationProp } from './governanceTypes'

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
          backgroundColor="surfaceSecondary"
          p="m"
          mt="s"
          onPress={() => {
            isSelectingFromDropdown.current = true
            setInput(item.value)
            onValueChange(item.value)
            setFocused(false)
            // Blur the input to dismiss keyboard when proxy is selected
            inputRef.current?.blur()
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
    navigation.navigate('ProxiesScreen', {
      mint: mint.toBase58(),
    })
  }, [navigation, mint])

  const keyboard = useKeyboard()
  const screenHeight = Dimensions.get('window').height
  const maxListHeight = useMemo(() => {
    const availableHeight = screenHeight - keyboard.keyboardHeight
    return Math.max(150, Math.min(340, availableHeight))
  }, [keyboard.keyboardHeight, screenHeight])

  return (
    <FlatList
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
          <Text variant="body3" color="secondaryText" mb="xs">
            {selected ? selected.label : t('gov.assignProxy.searchPlaceholder')}
          </Text>
          <Box flexDirection="row" alignItems="center">
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
            <ButtonPressable
              backgroundColor="secondary"
              Icon={BrowseProxies}
              borderRadius="l"
              ml="s"
              onPress={handleBrowseVoters}
              padding="s"
              height={52}
              innerContainerProps={{ px: 'm' }}
            />
          </Box>
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
  } catch (e) {
    return false
  }
}
