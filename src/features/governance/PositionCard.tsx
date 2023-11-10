import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { PositionWithMeta } from '@helium/voter-stake-registry-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React, { useCallback, useState } from 'react'

interface IPositionCardProps extends Omit<BoxProps<Theme>, 'position'> {
  position: PositionWithMeta
}

export const PositionCard = ({ position, ...boxProps }: IPositionCardProps) => {
  const { symbol, json } = useMetaplexMetadata(position.votingMint.mint)
  const [actionsOpen, setActionsOpen] = useState(false)
  const handleActionPress = () => {
    setActionsOpen(false)
  }

  const actions = useCallback(() => {
    return (
      <>
        <ListItem
          key="split"
          title="Split"
          onPress={handleActionPress}
          selected={false}
          hasPressedState={false}
        />
        <ListItem
          key="transfer"
          title="Transfer"
          onPress={handleActionPress}
          selected={false}
          hasPressedState={false}
        />
        <ListItem
          key="extend"
          title="Extend"
          onPress={handleActionPress}
          selected={false}
          hasPressedState={false}
        />
      </>
    )
  }, [])

  return (
    <>
      <TouchableOpacityBox
        backgroundColor="secondaryBackground"
        borderRadius="l"
        onPress={() => setActionsOpen(true)}
        {...boxProps}
      >
        <Box paddingHorizontal="m" paddingVertical="ms">
          <Box
            flexDirection="row"
            justifyContent="space-between"
            marginBottom="m"
          >
            <Box flexDirection="row" alignItems="center">
              {json?.image ? (
                <TokenIcon size={26} img={json.image} />
              ) : undefined}
              <Text variant="subtitle3" color="primaryText" marginLeft="m">
                {`270,000 ${symbol}`}
              </Text>
            </Box>
            {position.hasGenesisMultiplier && (
              <Box
                padding="s"
                paddingHorizontal="m"
                backgroundColor="blueBright500"
                borderRadius="m"
              >
                <Text variant="body3" fontSize={10} color="black">
                  LANDRUSH
                </Text>
              </Box>
            )}
          </Box>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            paddingBottom="s"
          >
            <Box>
              <Text variant="body2" color="secondaryText">
                Lockup Type
              </Text>
              <Text variant="body2" color="primaryText">
                Constant
              </Text>
            </Box>
            <Box>
              <Text variant="body2" color="secondaryText" textAlign="right">
                Vote Multiplier
              </Text>
              <Text variant="body2" color="primaryText" textAlign="right">
                12.00
              </Text>
            </Box>
          </Box>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            paddingBottom="s"
          >
            <Box>
              <Text variant="body2" color="secondaryText">
                Min Duration
              </Text>
              <Text variant="body2" color="primaryText">
                6m
              </Text>
            </Box>
            {position.hasGenesisMultiplier && (
              <Box>
                <Text variant="body2" color="secondaryText" textAlign="right">
                  Landrush
                </Text>
                <Text variant="body2" color="primaryText" textAlign="right">
                  3x (3y 5m 22d)
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </TouchableOpacityBox>
      <BlurActionSheet
        title="Position Actions"
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
      >
        {actions()}
      </BlurActionSheet>
    </>
  )
}
