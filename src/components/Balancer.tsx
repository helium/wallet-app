import React, { ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'

type Props = {
  children?: ReactNode
  ratio?: number
}

type BareBalancerProps = {
  containerHeight?: number
  children?: ReactNode
  parentRef: React.RefObject<View>
  ratio?: number
}

const measureComponent = (
  component: React.RefObject<View>,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    if (component.current === null) {
      return { width: 0, height: 0 }
    }

    setTimeout(
      () =>
        component.current?.measure(
          (x: number, y: number, width: number, height: number) =>
            resolve({ width, height }),
        ),
      0,
    )
  })
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    display: 'flex',
    justifyContent: 'center',
  },
})

export const BareBalancerContainer: React.FC<Props> = ({ children, ratio }) => {
  const [dimensions, setDimensions] = useState<
    { width: number; height: number } | undefined
  >()

  const parentRef = useRef<View>(null)

  const onPageLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setDimensions({ width, height })
  }

  return (
    <View ref={parentRef} onLayout={onPageLayout} style={styles.container}>
      <BareBalancerWithoutPageLayout
        parentRef={parentRef}
        ratio={ratio}
        containerHeight={dimensions?.height}
      >
        {children}
      </BareBalancerWithoutPageLayout>
    </View>
  )
}

export const BareBalancerWithoutPageLayout: React.FC<BareBalancerProps> = ({
  children,
  containerHeight,
  parentRef,
  ratio = 1,
}) => {
  const [ran, setRan] = useState<boolean>(false)
  const childRef = useRef<View>(null)

  // investigate performance
  // useEffect(() => {
  //   setRan(false);
  // }, [children]);

  useLayoutEffect(() => {
    const relayout = async () => {
      const update = (width?: number) => {
        childRef.current?.setNativeProps({ style: { maxWidth: width } })
      }

      update(undefined)
      setRan(true)
      const { height: initialHeight, width: initialWidth } =
        await measureComponent(parentRef)

      let left: number = initialWidth / 2
      let right: number = initialWidth
      let middle: number

      while (left + 1 < right) {
        middle = ~~((left + right) / 2)

        update(middle)
        const { height: currentHeight } = await measureComponent(parentRef)

        if (currentHeight === initialHeight) {
          right = middle
        } else {
          left = middle
        }
      }

      // Update the wrapper width
      update(right * ratio + initialWidth * (1 - ratio))
      //update(initialWidth - (initialWidth - right) * ratio);
    }
    if (!ran) {
      if (parentRef.current === null) {
        return
      }
      void relayout()
    }
  }, [ran, containerHeight, parentRef, ratio])

  return <View ref={childRef}>{children}</View>
}
