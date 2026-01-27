/* eslint-disable no-bitwise */
/* eslint-disable func-names */

import { Buffer } from 'buffer'
import structuredClone from '@ungap/structured-clone'

// Web Streams API polyfill for React Native
if (typeof global.TransformStream === 'undefined') {
  const {
    TransformStream,
    ReadableStream,
    WritableStream,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require('web-streams-polyfill')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).TransformStream = TransformStream
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).ReadableStream =
    (global as any).ReadableStream || ReadableStream
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).WritableStream =
    (global as any).WritableStream || WritableStream
}

global.Buffer = Buffer
global.structuredClone = structuredClone

Buffer.prototype.subarray = function subarray(
  begin: number | undefined,
  end: number | undefined,
) {
  const result = Uint8Array.prototype.subarray.apply(this, [begin, end])
  Object.setPrototypeOf(result, Buffer.prototype) // Explicitly add the `Buffer` prototype (adds `readUIntLE`!)
  return result
}

// String.prototype.replaceAll() polyfill
if (!String.prototype.replaceAll) {
  // eslint-disable-next-line no-extend-native
  String.prototype.replaceAll = function (str, newStr) {
    // If a regex pattern
    if (
      Object.prototype.toString.call(str).toLowerCase() === '[object regexp]'
    ) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return this.replace(str, newStr)
    }

    // If a string
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return this.replace(new RegExp(str, 'g'), newStr)
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line no-extend-native
BigInt.prototype.toJSON = function () {
  return this.toString()
}

// AbortSignal.timeout() polyfill for React Native
if (typeof AbortSignal !== 'undefined' && !(AbortSignal as any).timeout) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  AbortSignal.timeout = function (ms: number): AbortSignal {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, ms)

    // Clean up the timeout if the signal is already aborted
    if (controller.signal.aborted) {
      clearTimeout(timeoutId)
    } else {
      controller.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId)
      })
    }

    return controller.signal
  }
}

// AbortSignal.any() polyfill for React Native
if (typeof AbortSignal !== 'undefined' && !(AbortSignal as any).any) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  AbortSignal.any = function (signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController()

    // If any signal is already aborted, abort immediately
    const hasAbortedSignal = signals.some((signal) => signal.aborted)
    if (hasAbortedSignal) {
      controller.abort()
      return controller.signal
    }

    // Listen for abort events on all signals
    const abortHandlers = signals.map((signal) => {
      const handler = () => {
        controller.abort()
        // Clean up all listeners
        signals.forEach((s, index) => {
          s.removeEventListener('abort', abortHandlers[index])
        })
      }
      signal.addEventListener('abort', handler)
      return handler
    })

    return controller.signal
  }
}
