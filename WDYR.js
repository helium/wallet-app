import React from 'react'

// eslint-disable-next-line no-undef
if (__DEV__) {
  // eslint-disable-next-line import/no-extraneous-dependencies, @typescript-eslint/no-var-requires
  const whyDidYouRender = require('@welldone-software/why-did-you-render')
  whyDidYouRender(React, {
    trackAllPureComponents: false,
  })
}
