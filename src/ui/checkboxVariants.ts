import { cva } from 'class-variance-authority'
import { twMerge } from './twMerge'

// World's checkbox (style guide §9.2): 16px, radius 4, 1px `input` border;
// checked fills with `primary`.
export const checkboxVariants = cva(
  'size-4 items-center justify-center rounded-[4px] border',
  {
    variants: {
      checked: {
        false: 'border-input',
        true: 'border-primary bg-primary',
      },
    },
  },
)

export const checkboxClassName = (checked: boolean, className?: string) =>
  twMerge(checkboxVariants({ checked }), className)
