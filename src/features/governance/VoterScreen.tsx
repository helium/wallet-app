import UserShare from '@assets/images/userShare.svg'
import UserX from '@assets/images/userX.svg'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { Markdown } from '@components/Markdown'
import { Pill } from '@components/Pill'
import Text from '@components/Text'
import { useMint } from '@helium/helium-react-hooks'
import { proxyQuery, useProxiedTo } from '@helium/voter-stake-registry-hooks'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { useQuery } from '@tanstack/react-query'
import { humanReadable, shortenAddress } from '@utils/formatting'
import BN from 'bn.js'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { NetworkTabs } from './NetworkTabs'
import { VoteHistory } from './VoteHistory'
import { VoterCardStat } from './VoterCardStat'
import {
  GovernanceNavigationProp,
  GovernanceStackParamList,
} from './governanceTypes'

type Route = RouteProp<GovernanceStackParamList, 'VoterScreen'>

export const VoterScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const wallet = useMemo(
    () => new PublicKey(route.params.wallet),
    [route.params.wallet],
  )
  const { mint, voteService, positions } = useGovernance()
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
  const { info: mintAcc } = useMint(mint)
  const decimals = mintAcc?.decimals
  const { votingPower, positions: proxiedToPositions } = useProxiedTo(wallet)
  const networks = proxy?.networks

  const handleAssignProxy = useCallback(() => {
    navigation.navigate('AssignProxyScreen', {
      wallet: wallet.toBase58(),
      mint: mint.toBase58(),
    })
  }, [navigation, wallet, mint])

  const handleRevokeProxy = useCallback(() => {
    navigation.navigate('RevokeProxyScreen', {
      wallet: wallet.toBase58(),
      mint: mint.toBase58(),
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
                <VoterCardStat
                  title="Current Rank"
                  value={`#${proxy.rank} of ${proxy.numProxies}`}
                />
                <VoterCardStat
                  title="Last Time Voted"
                  value={
                    proxy.lastVotedAt
                      ? new Date(proxy.lastVotedAt).toLocaleDateString()
                      : 'Never'
                  }
                />
              </Box>
              <Box flexDirection="row" alignItems="center">
                <ButtonPressable
                  flex={1}
                  LeadingComponent={<UserShare width={16} height={16} />}
                  backgroundColor="transparent"
                  titleColor="white"
                  borderColor="white"
                  borderWidth={unproxiedPositions?.length ? 1 : 0}
                  borderRadius="round"
                  backgroundColorOpacityPressed={0.7}
                  backgroundColorDisabled="black500"
                  title={t('gov.voter.assignProxy')}
                  disabled={!unproxiedPositions?.length}
                  mb={proxiedPositions?.length ? 's' : 'm'}
                  onPress={handleAssignProxy}
                />
                {proxiedPositions?.length ? (
                  <ButtonPressable
                    ml="m"
                    flex={1}
                    LeadingComponent={<UserX width={16} height={16} />}
                    backgroundColor="transparent"
                    titleColor="white"
                    borderColor="white"
                    borderWidth={1}
                    borderRadius="round"
                    backgroundColorOpacityPressed={0.7}
                    title={t('gov.voter.revokeProxy')}
                    mb="m"
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
                  <VoterCardStat
                    title="Current Rank"
                    value={`#${proxy.rank} of ${proxy.numProxies}`}
                  />
                  <VoterCardStat
                    title="Total Power"
                    value={
                      // Force 2 decimals
                      humanReadable(
                        new BN(proxy.delegatedVeTokens).div(
                          new BN(Math.pow(10, (decimals || 0) - 2)),
                        ),
                        2,
                      ) || ''
                    }
                  />
                </Box>
                <Box pt="s" flexDirection="row" justifyContent="space-between">
                  <VoterCardStat
                    title="Proposals Voted"
                    value={proxy.numProposalsVoted}
                  />
                  <VoterCardStat
                    title="Num Assignments"
                    value={proxy.numAssignments}
                  />
                </Box>
                {votingPower?.gt(new BN(0)) ? (
                  <Box
                    pt="s"
                    flexDirection="row"
                    justifyContent="space-between"
                  >
                    <VoterCardStat
                      title="Power From Me"
                      value={
                        // Force 2 decimals
                        humanReadable(
                          new BN(votingPower).div(
                            new BN(Math.pow(10, (decimals || 0) - 2)),
                          ),
                          2,
                        ) || ''
                      }
                    />
                    <VoterCardStat
                      title="Positions Assigned"
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

              <Box mb="m">
                <NetworkTabs />
              </Box>
            </>
          }
        />
      </Box>
    </BackScreen>
  )
}

export default VoterScreen
