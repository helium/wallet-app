import { BackScreen } from '@ui/BackScreen'
import { Pill } from '@ui/Pill'
import { proxyQuery, useProxiedTo } from '@helium/voter-stake-registry-hooks'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@ui/Button'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { humanReadable, shortenAddress } from '@utils/formatting'
import BN from 'bn.js'
import { Share, UserX } from 'lucide-react-native'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, View } from 'react-native'
import { withUniwind } from 'uniwind'
import { Markdown } from './Markdown'
import { VoteHistory } from './VoteHistory'
import { ProxyCardStat } from './ProxyCardStat'
import {
  GovernanceNavigationProp,
  GovernanceStackParamList,
} from './governanceTypes'

const ShareIcon = withUniwind(Share)
const UserXIcon = withUniwind(UserX)

type Route = RouteProp<GovernanceStackParamList, 'ProxyScreen'>

export const ProxyScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const wallet = useMemo(
    () => new PublicKey(route.params.wallet),
    [route.params.wallet],
  )
  const { mint, mintAcc, voteService, positions } = useGovernance()
  const { data: proxy, refetch } = useQuery(
    proxyQuery({
      wallet,
      voteService,
    }),
  )
  const unproxiedPositions = useMemo(
    () =>
      positions?.filter(
        (p) => !p.proxy || p.proxy.nextVoter.equals(PublicKey.default),
      ),
    [positions],
  )
  const proxiedPositions = useMemo(
    () =>
      positions?.filter(
        (p) =>
          p.proxy &&
          !p.proxy.nextVoter.equals(PublicKey.default) &&
          (!wallet || p.proxy.nextVoter.equals(wallet)),
      ),
    [positions, wallet],
  )

  const decimals = mintAcc?.decimals
  const { votingPower, positions: proxiedToPositions } = useProxiedTo(wallet)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const networks = proxy?.networks

  const handleAssignProxy = useCallback(() => {
    navigation.navigate('AssignProxyScreen', {
      mint: mint.toBase58(),
      wallet: wallet.toBase58(),
    })
  }, [navigation, wallet, mint])

  const handleRevokeProxy = useCallback(() => {
    navigation.navigate('RevokeProxyScreen', {
      mint: mint.toBase58(),
      wallet: wallet.toBase58(),
    })
  }, [navigation, wallet, mint])

  if (!proxy) {
    return (
      <BackScreen title={t('gov.title')}>
        <View className="flex-row items-center justify-center">
          <Spinner />
        </View>
      </BackScreen>
    )
  }
  return (
    <BackScreen className="p-4" title={t('gov.title')}>
      <View className="flex-col">
        <VoteHistory
          onRefresh={() => void refetch().catch(console.error)}
          wallet={wallet}
          header={
            <>
              <View className="flex-col items-center">
                <Image
                  source={{ uri: proxy?.image }}
                  className="size-20 rounded-full"
                />
                <Text size="xl" className="mt-4 font-semibold">
                  {proxy.name}
                </Text>
                <View className="mb-6 flex-row items-center">
                  <Text size="base" className="mr-2">
                    {shortenAddress(proxy.wallet)}
                  </Text>
                  {[...(networks || new Set())].map((n) => {
                    switch (n) {
                      case 'mobile':
                        return (
                          <Pill
                            key={n}
                            textSize="xs"
                            color="mobile"
                            text="MOBILE"
                          />
                        )
                      case 'hnt':
                        return (
                          <Pill key={n} textSize="xs" color="hnt" text="HNT" />
                        )
                      case 'iot':
                        return (
                          <Pill key={n} textSize="xs" color="iot" text="IOT" />
                        )
                    }
                    return null
                  })}
                </View>
              </View>
              <View className="mb-4 flex-row items-center justify-evenly rounded-[12px] bg-secondary p-6">
                <ProxyCardStat
                  title="Current Rank"
                  className="items-center"
                  value={`#${proxy.rank} of ${proxy.numProxies}`}
                />
                <ProxyCardStat
                  title="Last Time Voted"
                  className="items-center"
                  value={
                    proxy.lastVotedAt
                      ? new Date(proxy.lastVotedAt).toLocaleDateString()
                      : 'Never'
                  }
                />
              </View>
              <View className="mb-4 flex-row items-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-[50px] flex-1 rounded-full"
                  disabled={!unproxiedPositions?.length}
                  onPress={handleAssignProxy}
                >
                  <ShareIcon size={16} colorClassName="accent-foreground" />
                  <Text className="font-medium">
                    {t('gov.proxy.assignProxy')}
                  </Text>
                </Button>
                {proxiedPositions?.length ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className="ml-4 h-[50px] flex-1 rounded-full"
                    onPress={handleRevokeProxy}
                  >
                    <UserXIcon size={16} colorClassName="accent-foreground" />
                    <Text className="font-medium">
                      {t('gov.proxy.revokeProxy')}
                    </Text>
                  </Button>
                ) : null}
              </View>

              <View className="mb-4">
                <Markdown markdown={proxy.detail} />
              </View>
              <View className="my-4 rounded-[12px] bg-secondary p-4">
                <View className="flex-row justify-between border-b border-border pb-2">
                  <ProxyCardStat
                    title="Current Rank"
                    value={`#${proxy.rank} of ${proxy.numProxies}`}
                  />
                  <ProxyCardStat
                    title="Total Power"
                    className="items-end"
                    value={
                      // Force 2 decimals
                      decimals && proxy.proxiedVeTokens
                        ? humanReadable(
                            new BN(proxy.proxiedVeTokens).div(
                              new BN(10 ** (decimals - 2)),
                            ),
                            2,
                          ) || ''
                        : ''
                    }
                  />
                </View>
                <View className="flex-row justify-between pt-2">
                  <ProxyCardStat
                    title="Proposals Voted"
                    value={proxy.numProposalsVoted}
                  />
                  <ProxyCardStat
                    title="Num Assignments"
                    className="items-end"
                    value={proxy.numAssignments}
                  />
                </View>
                {votingPower?.gt(new BN(0)) ? (
                  <View className="flex-row justify-between pt-2">
                    <ProxyCardStat
                      title="Power From Me"
                      value={
                        // Force 2 decimals
                        votingPower && decimals
                          ? humanReadable(
                              new BN(votingPower).div(
                                new BN(10 ** (decimals - 2)),
                              ),
                              2,
                            ) || ''
                          : ''
                      }
                    />
                    <ProxyCardStat
                      title="Positions Assigned"
                      className="items-end"
                      value={proxiedToPositions?.length?.toString() || '0'}
                    />
                  </View>
                ) : null}
              </View>
              <View className="mb-12 mt-6 border-b border-border" />
            </>
          }
        />
      </View>
    </BackScreen>
  )
}

export default ProxyScreen
