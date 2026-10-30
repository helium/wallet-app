import { cva, type VariantProps } from 'class-variance-authority'
import { twMerge } from './twMerge'

// World's text inputs (style guide §9.2). `py-0` drops the Android default
// padding so the text stays centred in the fixed height. The focus ring is a
// border colour change: React Native has no outline ring.
export const inputVariants = cva(
  'w-full py-0 font-normal text-base text-foreground',
  {
    variants: {
      variant: {
        default:
          'h-9 rounded-md border border-input bg-transparent px-3 shadow-xs focus:border-ring',
        form: 'h-12 rounded-full bg-off-white px-5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type InputVariant = NonNullable<
  VariantProps<typeof inputVariants>['variant']
>

export const inputClassName = (variant?: InputVariant, className?: string) =>
  twMerge(inputVariants({ variant }), className)
