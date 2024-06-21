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
              <Box key={tag} marginRight="s" marginBottom="s">
                <Box
                  padding="s"
                  backgroundColor={
                    tag.toLowerCase().includes('temp check')
                      ? 'orange500'
                      : 'black600'
                  }
                  borderRadius="m"
                >
                  <Text fontSize={10} color="secondaryText">
                    {tag.toUpperCase()}
                  </Text>
                </Box>
              </Box>
            ))
        : null}
    </>
  )
}
