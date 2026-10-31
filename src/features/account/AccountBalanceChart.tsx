import React, { BaseSyntheticEvent, useEffect, useRef } from 'react'
import { Platform, processColor } from 'react-native'
import { ChartSelectEvent, LineChart } from 'react-native-charts-wrapper'
import { ScrollView } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { useCSSVariable } from 'uniwind'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import useHaptic from '@hooks/useHaptic'
import usePrevious from '@hooks/usePrevious'
import { AccountBalance } from '../../types/balance'

const CHART_HEIGHT = 140
const CONTENT_STYLE = {
  justifyContent: 'center',
  height: CHART_HEIGHT,
} as const
const CHART_STYLE = {
  flex: 1,
  marginHorizontal: -8,
  borderWidth: 0,
  maxHeight: CHART_HEIGHT,
}
type Props = {
  chartValues: Array<{ y: number; info: AccountBalance | undefined }>
  onHistorySelected: (accountBalance: AccountBalance) => void
  selectedBalance?: AccountBalance
}
const AccountBalanceChart = ({
  chartValues,
  onHistorySelected,
  selectedBalance,
}: Props) => {
  const { triggerImpact } = useHaptic()
  const [background, mutedForeground] = useCSSVariable([
    '--color-background',
    '--color-muted-foreground',
  ])

  const chartsRef = useRef<
    LineChart & {
      highlights: (
        next:
          | Array<{
              x: number
              dataSetIndex?: number | undefined
              dataIndex?: number | undefined
              y?: number | undefined
              stackIndex?: number | undefined
            }>
          | undefined,
      ) => void
    }
  >(null)

  const processedColors = {
    primaryBackground: processColor(String(background)),
    primaryText: processColor(String(mutedForeground)),
  }

  const prevSelectedBalance = usePrevious(selectedBalance)

  const handleSelect = (event: ChartSelectEvent | BaseSyntheticEvent) => {
    const coercedEvent = event?.nativeEvent as {
      data: { info: AccountBalance }
    }

    const info = coercedEvent?.data?.info
    onHistorySelected(info)

    if (info) {
      triggerImpact()
    }
  }

  useEffect(() => {
    if (prevSelectedBalance && !selectedBalance && chartsRef?.current) {
      chartsRef.current.highlights([])
    }
  }, [prevSelectedBalance, selectedBalance])

  return (
    <Animated.View entering={FADE_IN} exiting={FADE_OUT}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={CONTENT_STYLE}
        scrollEnabled={false}
      >
        <LineChart
          ref={chartsRef}
          style={CHART_STYLE}
          onSelect={handleSelect}
          xAxis={{
            enabled: false,
            drawAxisLines: false,
            drawGridLines: false,
            drawLabels: false,
          }}
          drawBorders={false}
          borderColor={processedColors.primaryBackground}
          chartDescription={{ text: '' }}
          borderWidth={0}
          yAxis={{
            left: {
              enabled: false,
              drawGridLines: false,
              zeroLine: { enabled: false },
            },
            right: {
              enabled: false,
              drawGridLines: false,
              zeroLine: { enabled: false },
            },
          }}
          legend={{ enabled: false }}
          pinchZoom={false}
          chartBackgroundColor={processedColors.primaryBackground}
          scaleEnabled={false}
          scaleXEnabled={false}
          scaleYEnabled={false}
          data={{
            dataSets: [
              {
                label: '',
                config: {
                  drawHorizontalHighlightIndicator: false,
                  highlightColor: processedColors.primaryText,
                  lineWidth: 1,
                  color: processedColors.primaryText,
                  drawCircles: false,
                  drawValues: false,
                  mode: 'CUBIC_BEZIER',
                  drawFilled: true,
                  fillAlpha: 100,
                  fillGradient: {
                    colors: [
                      Platform.OS === 'ios'
                        ? processedColors.primaryBackground
                        : processedColors.primaryText,
                      Platform.OS === 'ios'
                        ? processedColors.primaryText
                        : processedColors.primaryBackground,
                    ],
                    positions: [0, 1],
                    orientation: 'TOP_BOTTOM',
                  },
                },
                values: chartValues,
              },
            ],
          }}
        />
      </ScrollView>
    </Animated.View>
  )
}

export default AccountBalanceChart
