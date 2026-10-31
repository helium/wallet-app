import { useContentColumnMargins } from '@utils/layout'
import React, { createContext, useContext } from 'react'
import { View, type ViewProps } from 'react-native'
import { twMerge } from './twMerge'

// True inside a content column, so a sheet inside it skips the margins.
export const InContentColumn = createContext(false)

// Margins for a gorhom sheet. A sheet mounts where its provider or portal
// host sits, so a sheet hosted inside a screen is already in the column.
export const useSheetMargins = () => {
  const margins = useContentColumnMargins()
  return useContext(InContentColumn) ? undefined : margins
}

export type ContentColumnProps = ViewProps & { className?: string }

// Holds content in the content column: clear of the side insets and centered
// at the content width cap on regular-width windows.
export const ContentColumn = ({
  className,
  children,
  style,
  ...viewProps
}: ContentColumnProps) => {
  const margins = useContentColumnMargins()
  return (
    <InContentColumn.Provider value>
      <View
        {...viewProps}
        className={twMerge('flex-1', className)}
        style={[margins, style]}
      >
        {children}
      </View>
    </InContentColumn.Provider>
  )
}

// Navigators pass this as `screenLayout`, so native chrome stays full width.
export const contentColumnLayout = ({
  children,
}: {
  children: React.ReactElement
}) => <ContentColumn>{children}</ContentColumn>
