import { debounce as lodashDebounce } from 'lodash'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounce = (func: any) => {
  if (!func) return undefined
  return lodashDebounce(func, 500, { leading: true, trailing: true })
}
