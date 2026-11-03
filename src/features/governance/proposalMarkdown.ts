import MarkdownIt from 'markdown-it'

const markdownParser = MarkdownIt()

export const renderProposalMarkdown = (markdown: string) =>
  markdownParser.render(markdown)

export const proposalSummary = (markdown: string): string | null => {
  const tokens = markdownParser.parse(markdown, {})
  const paragraphIndex = tokens.findIndex(
    (token) => token.type === 'paragraph_open',
  )
  const inline = paragraphIndex === -1 ? undefined : tokens[paragraphIndex + 1]
  if (!inline || inline.type !== 'inline') return null

  const summary = (inline.children ?? [])
    .map((child) => {
      switch (child.type) {
        case 'text':
        case 'code_inline':
          return child.content
        case 'softbreak':
        case 'hardbreak':
          return ' '
        default:
          return ''
      }
    })
    .join('')
    .trim()
  return summary || null
}
