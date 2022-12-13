/* eslint-disable no-bitwise */
/* eslint-disable func-names */

import { Buffer } from 'buffer'

global.Buffer = Buffer

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
