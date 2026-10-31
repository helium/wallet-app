import React from 'react'
import MarkdownDisplay from 'react-native-markdown-display'
import { useResolveClassNames } from 'uniwind'

export const Markdown: React.FC<{ markdown?: string }> = ({ markdown }) => {
  const hr = useResolveClassNames('mt-4')
  const body = useResolveClassNames('font-normal text-sm text-foreground')
  const blockquote = useResolveClassNames(
    'bg-transparent font-normal text-sm text-foreground',
  )
  const heading1 = useResolveClassNames(
    'py-3 font-medium text-xl text-foreground',
  )
  const heading2 = useResolveClassNames(
    'py-3 font-medium text-lg text-foreground',
  )
  const heading3 = useResolveClassNames(
    'py-3 font-medium text-base text-foreground',
  )

  if (!markdown) {
    return null
  }

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <MarkdownDisplay
      style={{ hr, blockquote, body, heading1, heading2, heading3 }}
    >
      {markdown}
    </MarkdownDisplay>
  )
}
