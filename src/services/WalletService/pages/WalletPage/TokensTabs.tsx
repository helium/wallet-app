import Box from '@components/Box'
import ScrollBox from '@components/ScrollBox'
import SegmentedControl from '@components/SegmentedControl'
import React, { useCallback, useMemo, useState } from 'react'
import Tokens from '@assets/images/tokens.svg'
import Collectables from '@assets/images/collectables.svg'
import TokensScreen from './TokensScreen'
import NftList from '@features/collectables/NftList'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { FadeIn } from 'react-native-reanimated'

const TokensTabs = () => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const options = useMemo(
    () => [
      {
        value: 'tokens',
        label: 'Tokens',
        Icon: Tokens,
      },
      {
        value: 'collectables',
        label: 'Collectables',
        Icon: Collectables,
      },
    ],
    [],
  )

  const onItemSelected = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  const TopTabs = useCallback(() => {
    return (
      <SegmentedControl
        options={options}
        selectedIndex={selectedIndex}
        onItemSelected={onItemSelected}
        marginTop="3xl"
        marginBottom={'xl'}
      />
    )
  }, [onItemSelected, options, selectedIndex])

  return (
    <ScrollBox
      contentContainerStyle={{
        flex: 1,
      }}
    >
      {selectedIndex === 0 ? (
        <ReAnimatedBox entering={FadeIn} flex={1}>
          <TokensScreen Tabs={<TopTabs />} />
        </ReAnimatedBox>
      ) : (
        <ReAnimatedBox entering={FadeIn} flex={1}>
          <NftList Tabs={<TopTabs />} />
        </ReAnimatedBox>
      )}
    </ScrollBox>
  )
}

export default TokensTabs
