/* eslint-disable react/jsx-props-no-spreading */
import { BoxProps, useResponsiveProp } from '@shopify/restyle'
import React, { memo, useCallback, useMemo } from 'react'
import { Spacing, Theme } from '@theme/theme'
import Box from './Box'
import SegmentedControlItem from './SegmentedControlItem'

type Props = BoxProps<Theme> & {
  values: { id: string; title: string }[]
  selectedId: string
  onChange: (id: string) => void
  padding?: Spacing
}
const SegmentedControl = ({
  values,
  selectedId,
  onChange,
  padding,
  ...boxProps
}: Props) => {
  const maxHeight = useResponsiveProp(boxProps.maxHeight)
  const minHeight = useResponsiveProp(boxProps.minHeight)
  const height = useResponsiveProp(boxProps.height)

  const handlePress = useCallback(
    (index: number) => () => {
      onChange(values[index].id)
    },
    [onChange, values],
  )

  const heights = useMemo(() => {
    return { maxHeight, minHeight, height }
  }, [height, maxHeight, minHeight])

  return (
    <Box flexDirection="row" width="100%" {...boxProps}>
      {values.map(({ id, title }, index) => (
        <React.Fragment key={id}>
          {index !== 0 && <Box width={1} />}
          <SegmentedControlItem
            onChange={handlePress(index)}
            isFirst={index === 0}
            isLast={index === values.length - 1}
            selected={values[index].id === selectedId}
            title={title}
            disabled={id === selectedId}
            padding={padding || 'l'}
            {...heights}
          />
        </React.Fragment>
      ))}
    </Box>
  )
}

export default memo(SegmentedControl)
