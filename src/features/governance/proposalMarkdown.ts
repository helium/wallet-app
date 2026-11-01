import MarkdownIt from 'markdown-it'

const markdownParser = MarkdownIt()

export const renderProposalMarkdown = (markdown: string) =>
  markdownParser.render(markdown)

export const proposalSummary = (markdown: string): string | null => {
  const firstParagraphMatch =
    renderProposalMarkdown(markdown).match(/<p>(.*?)<\/p>/i)
  return firstParagraphMatch
    ? firstParagraphMatch[0].replace(/<[^>]+>/g, '')
    : null
}
