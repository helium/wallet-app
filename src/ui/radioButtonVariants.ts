import { cva } from 'class-variance-authority'
import { twMerge } from './twMerge'

// World's radio (shadcn new-york RadioGroupItem): 16px, round, 1px `input`
// border; selected shows an 8px `primary` dot.
export const radioButtonVariants = cva(
  'size-4 items-center justify-center rounded-full border',
  {
    variants: {
      selected: {
        false: 'border-input',
        true: 'border-primary',
      },
    },
  },
)

export const radioButtonClassName = (selected: boolean, className?: string) =>
  twMerge(radioButtonVariants({ selected }), className)
