import { useColors } from '@config/theme/themeHooks'
import ChevronDown from '@assets/svgs/chevronDown.svg'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@config/theme/theme'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import BlurActionSheet from './BlurActionSheet'
import Box from './Box'
import ListItem from './ListItem'
import Text from './Text'
import TouchableContainer from './TouchableContainer'
import { Search } from './Search'

export type SelectProps = {
  placeholder: string
  initialValue: string | number | undefined
  onValueChange: (value: string | number) => void
  hasSearch?: boolean
  options: {
    label: string
    value: string | number
    subLabel?: string
    icon?: React.ReactNode
  }[]
} & BoxProps<Theme>
export const Select: React.FC<SelectProps> = ({
  initialValue,
  onValueChange,
  options,
  placeholder,
  hasSearch,
  ...rest
}) => {
  const [value, setValue] = useState(initialValue)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { t } = useTranslation()
  const colors = useColors()

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  )

  const [filteredOptions, setFilteredOptions] = useState(options)

  const onFilterChange = useCallback(
    (text: string) => {
      if (text === '') {
        setFilteredOptions(options)
      } else {
        setFilteredOptions(options.filter((o) => o.label.includes(text)))
      }
    },
    [options],
  )

  const renderItem = useCallback(
    ({ item, index }: { item: (typeof options)[0]; index: number }) => {
      const borderTopStartRadius = index === 0 ? 'xl' : 'none'
      const borderTopEndRadius = index === 0 ? 'xl' : 'none'
      const borderBottomStartRadius =
        index === filteredOptions.length - 1 ? 'xl' : 'none'
      const borderBottomEndRadius =
        index === filteredOptions.length - 1 ? 'xl' : 'none'

      return (
        <ListItem
          key={item.value}
          title={item.label}
          onPress={() => {
            setValue(item.value)
            onValueChange(item.value)
            setFiltersOpen(false)
          }}
          selected={value === item.value}
          borderTopStartRadius={borderTopStartRadius}
          borderTopEndRadius={borderTopEndRadius}
          borderBottomStartRadius={borderBottomStartRadius}
          borderBottomEndRadius={borderBottomEndRadius}
        />
      )
    },
    [onValueChange, filteredOptions, value],
  )

  const renderHeader = useCallback(() => {
    return hasSearch ? (
      <Search
        placeholder={placeholder}
        onChangeText={onFilterChange}
        marginBottom="md"
      />
    ) : null
  }, [hasSearch, placeholder, onFilterChange])

  return (
    <>
      <TouchableContainer
        padding="2xl"
        backgroundColor="cardBackground"
        backgroundColorPressed="secondaryBackground"
        borderRadius="2xl"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        onPress={() => setFiltersOpen(true)}
        {...rest}
      >
        <Box gap="xs" flexDirection="column">
          <Box>
            {selectedOption?.icon}
            {selectedOption ? (
              <Text variant="textLgSemibold" color="primaryText">
                {selectedOption?.label}
              </Text>
            ) : (
              <Text variant="textLgSemibold" color="text.placeholder">
                {placeholder}
              </Text>
            )}
          </Box>
          {selectedOption?.subLabel && (
            <Text variant="textXsMedium" color="text.quaternary-500">
              {selectedOption?.subLabel}
            </Text>
          )}
        </Box>
        <ChevronDown color={colors.secondaryText} />
      </TouchableContainer>
      <BlurActionSheet
        title={t('gov.proposals.filterTitle')}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      >
        <FlatList
          data={filteredOptions}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.value}`}
          ListHeaderComponent={renderHeader}
        />
      </BlurActionSheet>
    </>
  )
}
