import { useTheme } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React from 'react'
import MarkdownDisplay from 'react-native-markdown-display'

export const Markdown: React.FC<{ markdown?: string }> = ({ markdown }) => {
  const theme = useTheme<Theme>()

  if (!markdown) {
    return null
  }

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <MarkdownDisplay
      markdown={markdown}
      style={{
        hr: {
          marginTop: theme.spacing[4],
        },
        blockquote: {
          ...theme.textVariants.textSmRegular,
          color: theme.colors.primaryText,
          backgroundColor: 'transparent',
        },
        body: {
          ...(theme.textVariants.textSmRegular as any),
          color: theme.colors.primaryText,
        },
        heading1: {
          ...theme.textVariants.textXlMedium,
          color: theme.colors.primaryText,
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[4],
        },
        heading2: {
          ...theme.textVariants.textSmMedium,
          color: theme.colors.primaryText,
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[4],
        },
        heading3: {
          ...theme.textVariants.textXsMedium,
          color: theme.colors.primaryText,
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[4],
        },
      }}
    >
      {markdown}
    </MarkdownDisplay>
  )
}
