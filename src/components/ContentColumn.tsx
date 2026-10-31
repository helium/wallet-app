import React from 'react'
import { useContentColumnMargins } from '@utils/layout'
import Box from './Box'
import { InContentColumn } from '../ui/ContentColumn'

export { useSheetMargins } from '../ui/ContentColumn'

// Holds a screen in the content column: clear of the side insets and
// centered at the content width cap on regular-width windows.
// Navigators pass it as `screenLayout`, so native chrome stays full width.
export const contentColumnLayout = ({
  children,
}: {
  children: React.ReactElement
}) => {
  return <ContentColumn>{children}</ContentColumn>
}

const ContentColumn = ({ children }: { children: React.ReactNode }) => {
  const margins = useContentColumnMargins()
  return (
    <InContentColumn.Provider value>
      <Box flex={1} style={margins}>
        {children}
      </Box>
    </InContentColumn.Provider>
  )
}

export default ContentColumn
