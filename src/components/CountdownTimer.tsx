import React, {
  forwardRef,
  memo,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import Lock from '@assets/images/lockClosed.svg'
import { LayoutChangeEvent } from 'react-native'
import { BoxProps } from '@shopify/restyle'
import { format } from 'date-fns'
import { useColors } from '@theme/themeHooks'
import useDisappear from '@hooks/useDisappear'
import { Theme } from '@theme/theme'
import Text from './Text'
import Box from './Box'

export type TimerRef = {
  start: (duration: number) => void
  clear: () => void
}

type Props = { onExpired: () => void; visible: boolean } & BoxProps<Theme>

const CountdownTimer = forwardRef(
  ({ onExpired, visible, ...boxProps }: Props, ref: Ref<TimerRef>) => {
    useImperativeHandle(ref, () => ({ start, clear }))

    const [timerWidth, setTimerWidth] = useState(0)
    const [timerSeconds, setTimerSeconds] = useState(-1)
    const timerRef = useRef<NodeJS.Timeout>()
    const { primaryText } = useColors()

    const start = useCallback((duration: number) => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        setTimerSeconds(duration)
      }
      timerRef.current = setInterval(() => {
        setTimerSeconds((prevSeconds) => {
          const nextSeconds = prevSeconds - 1
          return nextSeconds > -1 ? nextSeconds : duration
        })
      }, 1000)
    }, [])

    const clear = useCallback(() => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }, [])

    useEffect(() => {
      if (timerSeconds !== 0) {
        return
      }

      onExpired()
    }, [onExpired, timerSeconds])

    useDisappear(() => {
      if (!timerRef.current) return
      clearInterval(timerRef.current)
    })

    const timeStr = useMemo(
      () => format(new Date(timerSeconds * 1000), 'mm:ss'),
      [timerSeconds],
    )

    const handleTimerLayout = useCallback(
      (event: LayoutChangeEvent) => {
        if (timerWidth) return
        setTimerWidth(event.nativeEvent.layout.width)
      },
      [timerWidth],
    )

    if (!visible) return null

    return (
      <Box
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...boxProps}
      >
        <Box
          paddingVertical="xxs"
          paddingLeft="ms"
          alignSelf="flex-end"
          margin="m"
          backgroundColor="surfaceSecondary"
          borderRadius="round"
          width={timerWidth || undefined}
          flexDirection="row"
          alignItems="center"
          onLayout={handleTimerLayout}
        >
          <Lock color={primaryText} />
          <Text
            paddingRight="ms"
            variant="body2"
            color="primaryText"
            marginLeft="xs"
            textAlign="right"
            numberOfLines={1}
          >
            {timeStr}
          </Text>
        </Box>
      </Box>
    )
  },
)

export default memo(CountdownTimer)
