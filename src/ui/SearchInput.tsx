import { Search } from 'lucide-react-native'
import React from 'react'
import { type TextInput, type TextInputProps, View } from 'react-native'
import { withUniwind } from 'uniwind'
import { Input } from './Input'
import { twMerge } from './twMerge'

const SearchIcon = withUniwind(Search)

export type SearchInputProps = {
  placeholder: string
  value?: string
  onChangeText?: (text: string) => void
  onEnter?: (text: string) => void
  autoFocus?: boolean
  textInputProps?: TextInputProps
  ref?: React.Ref<TextInput>
  className?: string
}

// A search field on a secondary panel. Submit reports the value through
// onEnter when there is one. `textInputProps` override the field defaults.
export const SearchInput = ({
  placeholder,
  value,
  onChangeText,
  onEnter,
  autoFocus = false,
  textInputProps = {},
  ref,
  className,
}: SearchInputProps) => (
  <View
    className={twMerge(
      'flex-row items-center rounded-lg bg-secondary ps-4',
      className,
    )}
  >
    <SearchIcon size={16} colorClassName="accent-muted-foreground" />
    <Input
      ref={ref}
      className="h-12 w-auto flex-1 rounded-none border-0 px-4 text-sm shadow-none"
      onChangeText={onChangeText}
      onSubmitEditing={() => {
        if (value && onEnter) onEnter(value)
      }}
      value={value}
      placeholder={placeholder}
      autoCorrect={false}
      autoComplete="off"
      autoFocus={autoFocus}
      {...textInputProps}
    />
  </View>
)
