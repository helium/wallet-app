import React, { createContext, useContext } from 'react'
import { useContentColumnMargins } from '@utils/layout'
import Box from './Box'

const InContentColumn = createContext(false)

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

// Margins for a gorhom sheet. A sheet mounts where its provider or portal
// host sits, so a sheet hosted inside a screen is already in the column.
export const useSheetMargins = () => {
  const margins = useContentColumnMargins()
  return useContext(InContentColumn) ? undefined : margins
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
