import Box from '@components/Box'
import Text from '@components/Text'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import { useColors, useSpacing } from '@theme/themeHooks'
import React, { useCallback, useState } from 'react'
import { Image, Switch } from 'react-native'
import { useDispatch } from 'react-redux'
import VisibilityOff from '@assets/images/visibilityOff.svg'
import { collectables as collectablesSli } from '@store/slices/collectablesSlice'

export type Collection = {
  id: string
  name: string
  image: string
  description: string
  count: number
}

type CollectionItemProps = {
  collection: Collection
  initalEnabled: boolean
}
const CollectionItem = ({
  collection,
  initalEnabled,
  ...rest
}: CollectionItemProps & BoxProps<Theme>) => {
  const spacing = useSpacing()
  const [approved, setApproved] = useState(initalEnabled)
  const dispatch = useDispatch()
  const colors = useColors()

  const onApprove = useCallback(
    (id: string) => (approved: boolean) => {
      setApproved(approved)
      dispatch(
        collectablesSli.actions.toggleApprovedCollection({
          collection: id,
        }),
      )
    },
    [],
  )

  return (
    <Box
      backgroundColor={'cardBackground'}
      borderColor={'primaryBackground'}
      padding="4"
      flexDirection="row"
      gap="2"
      alignItems="center"
      {...rest}
    >
      {approved ? (
        <Image
          source={{ uri: collection.image }}
          style={{ width: 40, height: 40, borderRadius: spacing.sm }}
        />
      ) : (
        <Box
          width={40}
          height={40}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <VisibilityOff color={colors.primaryText} width={20} height={20} />
        </Box>
      )}
      <Box flex={1}>
        <Text variant="textLgSemibold" color="primaryText" numberOfLines={1}>
          {collection.name}
        </Text>
        <Text variant="textSmRegular" color="secondaryText">
          {collection.count}
        </Text>
      </Box>
      <Box>
        <Switch
          value={approved}
          trackColor={{ false: 'secondaryText', true: 'blue.light-500' }}
          thumbColor="primaryBackground"
          onValueChange={onApprove(collection.id)}
        />
      </Box>
    </Box>
  )
}

export default CollectionItem
