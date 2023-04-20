export const removeDashAndCapitalize = (str: string) => {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
}
