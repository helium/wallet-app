import type React from 'react'
import { isTextLabel } from '../isTextLabel'

describe('isTextLabel', () => {
  it('accepts a string', () => {
    expect(isTextLabel('Send')).toBe(true)
  })

  it('accepts a number', () => {
    expect(isTextLabel(5)).toBe(true)
  })

  it('accepts a mixed string and number array', () => {
    expect(isTextLabel(['Send ', 5])).toBe(true)
  })

  it('accepts an array with false and null holes', () => {
    expect(isTextLabel(['Send', false, null])).toBe(true)
  })

  it('rejects a React element', () => {
    const element = { type: 'View', props: {} } as unknown as React.ReactNode
    expect(isTextLabel(element)).toBe(false)
  })

  it('rejects a nested array', () => {
    expect(isTextLabel(['Send', ['nested']])).toBe(false)
  })
})
