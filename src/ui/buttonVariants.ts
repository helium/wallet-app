import { cva, type VariantProps } from 'class-variance-authority'
import { twMerge } from './twMerge'

// World's button variants and sizes (style guide §9.1). Web-only classes
// (hover, focus ring, svg selectors) and the landing variants are left out.
const buttonVariants = cva(
  'flex-row items-center justify-center gap-2 rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        destructive: 'bg-destructive',
        outline: 'border border-border bg-background',
        secondary: 'bg-secondary',
        ghost: 'bg-transparent',
        link: 'bg-transparent',
        cta: 'bg-purple-700',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 gap-1.5 px-3',
        lg: 'h-10 px-6',
        icon: 'size-9',
        dashboard: 'h-[43px] rounded-[30px] px-5',
      },
      disabled: {
        true: 'opacity-50',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

// Size comes from @ui Text's default (14px).
export const buttonTextVariants = cva('font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-white',
      outline: 'text-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground',
      link: 'text-primary underline',
      cta: 'text-white',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>['variant']
>
export type ButtonSize = NonNullable<
  VariantProps<typeof buttonVariants>['size']
>

export const buttonClassName = (
  {
    variant,
    size,
    disabled,
  }: { variant?: ButtonVariant; size?: ButtonSize; disabled?: boolean | null },
  className?: string,
) => twMerge(buttonVariants({ variant, size, disabled }), className)
