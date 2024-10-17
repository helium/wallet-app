import Box from '@components/Box'
import Text from '@components/Text'
import React from 'react'

export const ProposalTags: React.FC<{
  tags?: string[]
}> = ({ tags }) => {
  return (
    <>
      {tags
        ? tags
            .filter((tag) => tag !== 'tags')
            .map((tag) => (
              <Box key={tag} marginRight="2" marginBottom="2">
                <Box
                  padding="2"
                  backgroundColor={
                    tag.toLowerCase().includes('temp check')
                      ? 'orange.500'
                      : 'fg.quinary-400'
                  }
                  borderRadius="sm"
                >
                  <Text
                    variant="textSmSemibold"
                    fontSize={10}
                    color="primaryBackground"
                  >
                    {tag.toUpperCase()}
                  </Text>
                </Box>
              </Box>
            ))
        : null}
    </>
  )
}
