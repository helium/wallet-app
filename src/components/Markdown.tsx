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
          marginTop: theme.spacing.m,
        },
        blockquote: {
          ...theme.textVariants.body2,
          color: theme.colors.primaryText,
          backgroundColor: 'transparent',
        },
        body: {
          ...theme.textVariants.body2,
          color: theme.colors.primaryText,
        },
        heading1: {
          ...theme.textVariants.subtitle1,
          color: theme.colors.primaryText,
          paddingTop: theme.spacing.ms,
          paddingBottom: theme.spacing.ms,
        },
        heading2: {
          ...theme.textVariants.subtitle2,
          color: theme.colors.primaryText,
          paddingTop: theme.spacing.ms,
          paddingBottom: theme.spacing.ms,
        },
        heading3: {
          ...theme.textVariants.subtitle3,
          color: theme.colors.primaryText,
          paddingTop: theme.spacing.ms,
          paddingBottom: theme.spacing.ms,
        },
      }}
    >
      {markdown}
    </MarkdownDisplay>
  )
}
