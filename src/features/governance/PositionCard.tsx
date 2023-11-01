import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import ListItem from '@components/ListItem'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React, { useState, useCallback } from 'react'

interface IPositionCardProps extends Omit<BoxProps<Theme>, 'position'> {
  position: string
}

export const PositionCard = ({ position, ...boxProps }: IPositionCardProps) => {
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
        backgroundColor="surfaceSecondary"
        borderRadius="l"
        onPress={() => setActionsOpen(true)}
        {...boxProps}
      >
        <Box padding="m">
          <Box
            flexDirection="row"
            justifyContent="space-between"
            marginBottom="m"
          >
            <Text variant="subtitle1" color="primaryText" fontSize={16}>
              {`Position ${position}`}
            </Text>
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
