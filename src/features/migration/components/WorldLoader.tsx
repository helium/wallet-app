import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import React, { FC } from 'react'

// Centered spinner + caption used by the migration flow's loading screens.
// One spinner size and one caption style for every full-screen wait, so the
// same moment doesn't render at different scales across steps.
const WorldLoader: FC<{ caption: string }> = ({ caption }) => (
  <Box flex={1} justifyContent="center" alignItems="center">
    <CircleLoader loaderSize={40} color="worldPurple" />
    <Text variant="body2" color="worldSecondaryInk" marginTop="m">
      {caption}
    </Text>
  </Box>
)

export default WorldLoader
