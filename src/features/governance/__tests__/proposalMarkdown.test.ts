import { renderProposalMarkdown } from '../proposalMarkdown'

describe('renderProposalMarkdown', () => {
  it('renders a heading, a link and a list as CommonMark HTML', () => {
    const markdown = [
      '# HIP 1',
      '',
      'Read [the spec](https://example.com/hip-1).',
      '',
      '- first',
      '- second',
    ].join('\n')

    expect(renderProposalMarkdown(markdown)).toBe(
      [
        '<h1>HIP 1</h1>',
        '<p>Read <a href="https://example.com/hip-1">the spec</a>.</p>',
        '<ul>',
        '<li>first</li>',
        '<li>second</li>',
        '</ul>',
        '',
      ].join('\n'),
    )
  })
})
