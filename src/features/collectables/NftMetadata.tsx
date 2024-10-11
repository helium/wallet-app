import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@components/Box'
import Text from '@components/Text'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import { is } from 'date-fns/locale'

function stringify(
  s: boolean | string | string[] | undefined,
): string | undefined {
  if (Array.isArray(s)) {
    if (s.length === 0) {
      return 'None'
    }
    return s.join(', ')
  }

  return s?.toString()
}

const NftMetadata = ({ metadata }) => {
  const { t } = useTranslation()

  const Attribute = useCallback(
    ({
      traitType,
      traitValue,
      ...rest
    }: {
      traitType: string
      traitValue: boolean | string | string[] | undefined
    } & BoxProps<Theme>) => {
      return (
        <Box
          padding="3"
          paddingHorizontal="4"
          backgroundColor="cardBackground"
          key={`${traitType}+${stringify(traitValue)}`}
          {...rest}
        >
          <Text variant="textSmSemibold" color="primaryText">
            {traitType?.toUpperCase() ||
              t('collectablesScreen.collectables.noTraitType')}
          </Text>
          <Text variant="textMdRegular" color="secondaryText" textAlign="left">
            {stringify(traitValue) ||
              t('collectablesScreen.collectables.noTraitValue')}
          </Text>
        </Box>
      )
    },
    [t],
  )

  return (
    <Box flexDirection="column">
      {metadata.attributes?.map(({ trait_type, value }, index) => {
        const isFirst = index === 0
        const isLast = index === metadata.attributes.length - 1
        const borderTopStartRadius = isFirst ? 'xl' : undefined
        const borderTopEndRadius = isFirst ? 'xl' : undefined
        const borderBottomStartRadius = isLast ? 'xl' : undefined
        const borderBottomEndRadius = isLast ? 'xl' : undefined

        return (
          <Attribute
            key={index}
            traitType={trait_type}
            traitValue={value}
            borderTopStartRadius={borderTopStartRadius}
            borderTopEndRadius={borderTopEndRadius}
            borderBottomStartRadius={borderBottomStartRadius}
            borderBottomEndRadius={borderBottomEndRadius}
            borderColor={'primaryBackground'}
            borderBottomWidth={!isLast ? 2 : 0}
          />
        )
      })}
    </Box>
  )
}

export default NftMetadata
