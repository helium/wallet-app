import { cva, type VariantProps } from 'class-variance-authority'

// World's dashboard card and PanelCard (style guide §9.3). Dashboard cards
// have no border; the stat-box shadow sets them off the off-white canvas.
export const cardVariants = cva('', {
  variants: {
    variant: {
      default: 'rounded-[15px] bg-card p-4 shadow-stat-box',
      panel: 'rounded-2xl bg-secondary px-4 py-[15px]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export type CardVariant = NonNullable<
  VariantProps<typeof cardVariants>['variant']
>
