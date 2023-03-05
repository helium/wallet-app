export const prependHttp = (url: string, { https = true } = {}) => {
  if (typeof url !== 'string') {
    throw new TypeError(
      `Expected \`url\` to be of type \`string\`, got \`${typeof url}\``,
    )
  }

  const trimmedUrl = url.trim()

  if (/^\.*\/|^(?!localhost)\w+?:/.test(trimmedUrl)) {
    return trimmedUrl
  }

  return trimmedUrl.replace(
    /^(?!(?:\w+?:)?\/\/)/,
    https ? 'https://' : 'http://',
  )
}
