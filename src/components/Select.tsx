import ChevronDown from '@assets/images/chevronDown.svg'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React, { useState } from 'react'
import BlurActionSheet from './BlurActionSheet'
import Box from './Box'
import ListItem from './ListItem'
import Text from './Text'
import TouchableContainer from './TouchableContainer'

export type SelectProps = {
  title: string
  value: string
  onValueChange: (value: string) => void
  options: {
    label: string
    value: string
    icon?: React.ReactNode
  }[]
} & BoxProps<Theme>
export const Select: React.FC<SelectProps> = ({
  title,
  value,
  onValueChange,
  options,
  ...rest
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <>
      <TouchableContainer
        padding="m"
        borderWidth={1}
        borderColor="grey400"
        backgroundColor="black"
        borderRadius="l"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        onPress={() => setFiltersOpen(true)}
        {...rest}
      >
        <Box flexDirection="row" alignItems="center">
          {options.find((o) => o.value === value)?.icon}
          <Text variant="body2" color="white" ml="s">
            {options.find((o) => o.value === value)?.label}
          </Text>
        </Box>
        <ChevronDown color="gray" />
      </TouchableContainer>
      <BlurActionSheet
        title={title}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      >
        <>
          {options.map((option) => (
            <ListItem
              key={option.value}
              title={option.label}
              onPress={() => {
                onValueChange(option.value)
                setFiltersOpen(false)
              }}
              selected={value === option.value}
              hasPressedState={false}
            />
          ))}
        </>
      </BlurActionSheet>
    </>
  )
}
