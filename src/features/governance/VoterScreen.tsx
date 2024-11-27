import UserShare from '@assets/svgs/userShare.svg'
import UserX from '@assets/svgs/userX.svg'
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
import { useGovernance } from '@config/storage/GovernanceProvider'
import { useQuery } from '@tanstack/react-query'
import { humanReadable, shortenAddress } from '@utils/formatting'
import BN from 'bn.js'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import ScrollBox from '@components/ScrollBox'
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
    <ScrollBox>
      <BackScreen padding="4" title={t('gov.title')}>
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
                  <Text mt="4" variant="textXlRegular">
                    {proxy.name}
                  </Text>
                  <Box flexDirection="row" alignItems="center" mb="6" gap="1">
                    <Text mr="2" variant="textMdRegular">
                      {shortenAddress(proxy.wallet)}
                    </Text>
                    {[...(networks || new Set())].map((n) => {
                      switch (n) {
                        case 'mobile':
                          return (
                            <Pill
                              key={n}
                              textProps={{ variant: 'textSmRegular' }}
                              color="mobileBlue"
                              text="MOBILE"
                            />
                          )
                        case 'hnt':
                          return (
                            <Pill
                              key={n}
                              textProps={{ variant: 'textSmRegular' }}
                              color="hntBlue"
                              text="HNT"
                            />
                          )
                        case 'iot':
                          return (
                            <Pill
                              key={n}
                              textProps={{ variant: 'textSmRegular' }}
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
                  backgroundColor="bg.tertiary"
                  borderRadius="2xl"
                  alignItems="center"
                  justifyContent="space-evenly"
                  p="6"
                  mb="4"
                >
                  <VoterCardStat
                    title="Current Rank"
                    alignItems="center"
                    value={`#${proxy.rank} of ${proxy.numProxies}`}
                  />
                  <VoterCardStat
                    title="Last Time Voted"
                    alignItems="center"
                    value={
                      proxy.lastVotedAt
                        ? new Date(proxy.lastVotedAt).toLocaleDateString()
                        : 'Never'
                    }
                  />
                </Box>
                <Box flexDirection="row" alignItems="center" mb="4">
                  <ButtonPressable
                    height={50}
                    flex={1}
                    LeadingComponent={<UserShare width={16} height={16} />}
                    backgroundColor="transparent"
                    titleColor="base.white"
                    borderColor="base.white"
                    borderWidth={1}
                    borderRadius="full"
                    backgroundColorOpacityPressed={0.7}
                    backgroundColorDisabled="gray.800"
                    title={t('gov.voter.assignProxy')}
                    disabled={!unproxiedPositions?.length}
                    onPress={handleAssignProxy}
                  />
                  {proxiedPositions?.length ? (
                    <ButtonPressable
                      flex={1}
                      height={50}
                      ml="4"
                      LeadingComponent={<UserX width={16} height={16} />}
                      backgroundColor="transparent"
                      titleColor="base.white"
                      borderColor="base.white"
                      borderWidth={1}
                      borderRadius="full"
                      backgroundColorOpacityPressed={0.7}
                      title={t('gov.voter.revokeProxy')}
                      onPress={handleRevokeProxy}
                    />
                  ) : null}
                </Box>

                <Box mb="4">
                  <Markdown markdown={proxy.detail} />
                </Box>
                <Box
                  backgroundColor="bg.tertiary"
                  borderRadius="2xl"
                  p="4"
                  mt="4"
                  mb="4"
                >
                  <Box
                    pb="2"
                    flexDirection="row"
                    borderBottomColor="border.primary"
                    borderBottomWidth={1}
                    justifyContent="space-between"
                  >
                    <VoterCardStat
                      title="Current Rank"
                      value={`#${proxy.rank} of ${proxy.numProxies}`}
                    />
                    <VoterCardStat
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
                  <Box
                    pt="2"
                    flexDirection="row"
                    justifyContent="space-between"
                  >
                    <VoterCardStat
                      title="Proposals Voted"
                      value={proxy.numProposalsVoted}
                    />
                    <VoterCardStat
                      title="Num Assignments"
                      alignItems="flex-end"
                      value={proxy.numAssignments}
                    />
                  </Box>
                  {votingPower?.gt(new BN(0)) ? (
                    <Box
                      pt="2"
                      flexDirection="row"
                      justifyContent="space-between"
                    >
                      <VoterCardStat
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
                      <VoterCardStat
                        title="Positions Assigned"
                        alignItems="flex-end"
                        value={proxiedToPositions?.length?.toString() || '0'}
                      />
                    </Box>
                  ) : null}
                </Box>
                <Box
                  mt="6"
                  mb="12"
                  borderBottomColor="border.primary"
                  borderBottomWidth={1}
                />

                <Box mb="4">
                  <NetworkTabs />
                </Box>
              </>
            }
          />
        </Box>
      </BackScreen>
    </ScrollBox>
  )
}

export default VoterScreen
