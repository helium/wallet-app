import { Text } from '@ui/Text'
import React from 'react'
import { View } from 'react-native'

export const ProposalTags: React.FC<{
  tags?: string[]
}> = ({ tags }) => {
  return (
    <>
      {tags
        ? tags
            .filter((tag) => tag !== 'tags')
            .map((tag) => {
              const tempCheck = tag.toLowerCase().includes('temp check')
              return (
                <View
                  key={tag}
                  className={
                    tempCheck
                      ? 'mb-2 mr-2 rounded-md bg-warning-100 p-2'
                      : 'mb-2 mr-2 rounded-md bg-background p-2'
                  }
                >
                  <Text
                    className={
                      tempCheck
                        ? 'text-[10px] text-warning-500'
                        : 'text-[10px] text-muted-foreground'
                    }
                  >
                    {tag.toUpperCase()}
                  </Text>
                </View>
              )
            })
        : null}
    </>
  )
}
