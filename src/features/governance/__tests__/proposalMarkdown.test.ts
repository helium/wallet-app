import { proposalSummary, renderProposalMarkdown } from '../proposalMarkdown'

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

  it('escapes raw HTML instead of passing it through', () => {
    expect(renderProposalMarkdown('<img src=x onerror=alert(1)>')).toBe(
      '<p>&lt;img src=x onerror=alert(1)&gt;</p>\n',
    )
  })
})

describe('proposalSummary', () => {
  it('returns the first paragraph as plain text', () => {
    const markdown =
      '# HIP 1\n\nRead [the spec](https://example.com/hip-1).\n\nSecond paragraph.'

    expect(proposalSummary(markdown)).toBe('Read the spec.')
  })

  it('returns null when there is no paragraph', () => {
    expect(proposalSummary('# Only a heading')).toBeNull()
  })

  it('decodes HTML entities in the summary', () => {
    expect(proposalSummary('Fees & rewards for "DC" < 1.')).toBe(
      'Fees & rewards for "DC" < 1.',
    )
  })

  it('joins a first paragraph that wraps across source lines', () => {
    expect(
      proposalSummary('# HIP 2\n\nFirst line\nsecond line.\n\nShort.'),
    ).toBe('First line second line.')
  })

  it('returns null when the first paragraph holds only an image', () => {
    expect(
      proposalSummary('![logo](https://example.com/a.png)\n\nText.'),
    ).toBeNull()
  })
})
