import { useColors } from '@theme/themeHooks'
import ChevronDown from '@assets/images/chevronDown.svg'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BlurActionSheet from './BlurActionSheet'
import Box from './Box'
import ListItem from './ListItem'
import Text from './Text'
import TouchableContainer from './TouchableContainer'

export type SelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: {
    label: string
    value: string
    icon?: React.ReactNode
  }[]
} & BoxProps<Theme>
export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  options,
  ...rest
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { t } = useTranslation()
  const colors = useColors()

  return (
    <>
      <TouchableContainer
        padding="4"
        borderWidth={1}
        borderColor="border.primary"
        backgroundColor="cardBackground"
        backgroundColorPressed={'secondaryBackground'}
        borderRadius="2xl"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        onPress={() => setFiltersOpen(true)}
        {...rest}
      >
        <Box flexDirection="row" alignItems="center">
          {options.find((o) => o.value === value)?.icon}
          <Text variant="textSmRegular" color="primaryText" ml="2">
            {options.find((o) => o.value === value)?.label}
          </Text>
        </Box>
        <ChevronDown color={colors.secondaryText} />
      </TouchableContainer>
      <BlurActionSheet
        title={t('gov.proposals.filterTitle')}
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
