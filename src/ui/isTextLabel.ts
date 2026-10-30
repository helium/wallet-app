import type React from 'react'

const isTextPart = (child: unknown) =>
  typeof child === 'string' ||
  typeof child === 'number' ||
  typeof child === 'boolean' ||
  child === null ||
  child === undefined

// True when children render as text only: a string, a number, or an array of
// strings and numbers (booleans, null and undefined render nothing).
export const isTextLabel = (children: React.ReactNode): boolean =>
  typeof children === 'string' ||
  typeof children === 'number' ||
  (Array.isArray(children) && children.every(isTextPart))
