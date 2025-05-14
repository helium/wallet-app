import UserShare from '@assets/images/userShare.svg'
import UserX from '@assets/images/userX.svg'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { Markdown } from '@components/Markdown'
import { Pill } from '@components/Pill'
import Text from '@components/Text'
import { proxyQuery, useProxiedTo } from '@helium/voter-stake-registry-hooks'
import { PartialEnhancedProxy } from '@helium/voter-stake-registry-sdk'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { useQuery } from '@tanstack/react-query'
import { humanReadable, shortenAddress } from '@utils/formatting'
import BN from 'bn.js'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { VoteHistory } from './VoteHistory'
import { ProxyCardStat } from './ProxyCardStat'
import {
  GovernanceNavigationProp,
  GovernanceStackParamList,
} from './governanceTypes'

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
  const { data: proxy, refetch } = useQuery<
    PartialEnhancedProxy & { networks: string[] }
  >(
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
        <Box flexDirection="row" justifyContent="center" alignItems="center">
          <CircleLoader loaderSize={20} />
        </Box>
      </BackScreen>
    )
  }
  return (
    <BackScreen padding="m" title={t('gov.title')}>
      <Box flexDirection="column">
        <VoteHistory
          onRefresh={refetch}
          wallet={wallet}
          header={
            <>
              <Box flexDirection="column" alignItems="center">
                <Image
                  source={{ uri: proxy?.image }}
                  style={{ width: 80, height: 80, borderRadius: 100 }}
                />
                <Text mt="m" variant="h4">
                  {proxy.name}
                </Text>
                <Box flexDirection="row" alignItems="center" mb="l">
                  <Text mr="s" variant="body1">
                    {shortenAddress(proxy.wallet)}
                  </Text>
                  {[...(networks || new Set())].map((n) => {
                    switch (n) {
                      case 'mobile':
                        return (
                          <Pill
                            key={n}
                            textProps={{ variant: 'body3' }}
                            color="mobileBlue"
                            text="MOBILE"
                          />
                        )
                      case 'hnt':
                        return (
                          <Pill
                            key={n}
                            textProps={{ variant: 'body3' }}
                            color="hntBlue"
                            text="HNT"
                          />
                        )
                      case 'iot':
                        return (
                          <Pill
                            key={n}
                            textProps={{ variant: 'body3' }}
                            color="iotGreen"
                            text="IOT"
                          />
                        )
                    }
                    return null
                  })}
                </Box>
              </Box>
              <Box
                flexDirection="row"
                backgroundColor="surfaceSecondary"
                borderRadius="l"
                alignItems="center"
                justifyContent="space-evenly"
                p="l"
                mb="m"
              >
                <ProxyCardStat
                  title="Current Rank"
                  alignItems="center"
                  value={`#${proxy.rank} of ${proxy.numProxies}`}
                />
                <ProxyCardStat
                  title="Last Time Voted"
                  alignItems="center"
                  value={
                    proxy.lastVotedAt
                      ? new Date(proxy.lastVotedAt).toLocaleDateString()
                      : 'Never'
                  }
                />
              </Box>
              <Box flexDirection="row" alignItems="center" mb="m">
                <ButtonPressable
                  height={50}
                  flex={1}
                  LeadingComponent={<UserShare width={16} height={16} />}
                  backgroundColor="transparent"
                  titleColor="white"
                  borderColor="white"
                  borderWidth={1}
                  borderRadius="round"
                  backgroundColorOpacityPressed={0.7}
                  backgroundColorDisabled="black500"
                  title={t('gov.proxy.assignProxy')}
                  disabled={!unproxiedPositions?.length}
                  onPress={handleAssignProxy}
                />
                {proxiedPositions?.length ? (
                  <ButtonPressable
                    flex={1}
                    height={50}
                    ml="m"
                    LeadingComponent={<UserX width={16} height={16} />}
                    backgroundColor="transparent"
                    titleColor="white"
                    borderColor="white"
                    borderWidth={1}
                    borderRadius="round"
                    backgroundColorOpacityPressed={0.7}
                    title={t('gov.proxy.revokeProxy')}
                    onPress={handleRevokeProxy}
                  />
                ) : null}
              </Box>

              <Box mb="m">
                <Markdown markdown={proxy.detail} />
              </Box>
              <Box
                backgroundColor="surfaceSecondary"
                borderRadius="l"
                p="m"
                mt="m"
                mb="m"
              >
                <Box
                  pb="s"
                  flexDirection="row"
                  borderBottomColor="dividerGrey"
                  borderBottomWidth={1}
                  justifyContent="space-between"
                >
                  <ProxyCardStat
                    title="Current Rank"
                    value={`#${proxy.rank} of ${proxy.numProxies}`}
                  />
                  <ProxyCardStat
                    title="Total Power"
                    alignItems="flex-end"
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
                </Box>
                <Box pt="s" flexDirection="row" justifyContent="space-between">
                  <ProxyCardStat
                    title="Proposals Voted"
                    value={proxy.numProposalsVoted}
                  />
                  <ProxyCardStat
                    title="Num Assignments"
                    alignItems="flex-end"
                    value={proxy.numAssignments}
                  />
                </Box>
                {votingPower?.gt(new BN(0)) ? (
                  <Box
                    pt="s"
                    flexDirection="row"
                    justifyContent="space-between"
                  >
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
                      alignItems="flex-end"
                      value={proxiedToPositions?.length?.toString() || '0'}
                    />
                  </Box>
                ) : null}
              </Box>
              <Box
                mt="l"
                mb="xxl"
                borderBottomColor="dividerGrey"
                borderBottomWidth={1}
              />
            </>
          }
        />
      </Box>
    </BackScreen>
  )
}

export default ProxyScreen
