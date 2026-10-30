import { cva, type VariantProps } from 'class-variance-authority'
import { extendTailwindMerge } from 'tailwind-merge'

// The World theme maps each weight class to a Figtree family (global.css), so
// weight and family classes conflict. `leading-*` wins over a size's line
// height in any order, so a size class must not drop it.
const twMerge = extendTailwindMerge({
  override: { conflictingClassGroups: { 'font-size': [] } },
  extend: {
    conflictingClassGroups: {
      'font-weight': ['font-family'],
      'font-family': ['font-weight'],
    },
  },
})

// World's type scale (style guide §2.3). Weight is a plain class
// (`font-medium`): global.css maps each weight class to its Figtree file.
const textVariants = cva('font-normal text-foreground', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
})

export type TextSize = NonNullable<VariantProps<typeof textVariants>['size']>

export const textClassName = (size?: TextSize, className?: string) =>
  twMerge(textVariants({ size }), className)
