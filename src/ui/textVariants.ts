import { cva, type VariantProps } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'

// World's type scale (style guide §2.3). Weight is a plain class
// (`font-medium`): global.css maps each weight class to its Figtree file.
export const textVariants = cva('font-normal text-foreground', {
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
