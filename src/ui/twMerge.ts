import { extendTailwindMerge } from 'tailwind-merge'

// The World theme maps each weight class to a Figtree family (global.css), so
// weight and family classes conflict. `leading-*` wins over a size's line
// height in any order, so a size class must not drop it.
export const twMerge = extendTailwindMerge({
  override: { conflictingClassGroups: { 'font-size': [] } },
  extend: {
    theme: { shadow: ['stat-box'] },
    conflictingClassGroups: {
      'font-weight': ['font-family'],
      'font-family': ['font-weight'],
    },
  },
})
