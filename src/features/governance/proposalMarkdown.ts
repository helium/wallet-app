import MarkdownIt from 'markdown-it'

const markdownParser = MarkdownIt()

export const renderProposalMarkdown = (markdown: string) =>
  markdownParser.render(markdown)
