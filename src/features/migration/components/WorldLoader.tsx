import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import React, { ComponentProps, FC } from 'react'

// Centered spinner + caption used by the migration flow's loading screens.
const WorldLoader: FC<{
  caption: string
  captionVariant?: ComponentProps<typeof Text>['variant']
}> = ({ caption, captionVariant = 'body3' }) => (
  <Box flex={1} justifyContent="center" alignItems="center">
    <CircleLoader loaderSize={30} color="worldPurple" />
    <Text variant={captionVariant} color="secondaryText" marginTop="m">
      {caption}
    </Text>
  </Box>
)

export default WorldLoader
