import Hnt from '@assets/images/hnt.svg'
import Iot from '@assets/images/iot.svg'
import Mobile from '@assets/images/mobile.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableContainer, {
  ButtonPressAnimationProps,
} from '@components/TouchableContainer'
import { useMint } from '@helium/helium-react-hooks'
import {
  PositionWithMeta,
  useRegistrar,
} from '@helium/voter-stake-registry-hooks'
import { useGovernance } from '@storage/GovernanceProvider'
import { networksToMint } from '@utils/constants'
import { getMinDurationFmt } from '@utils/dateTools'
import { humanReadable } from '@utils/formatting'
import BN from 'bn.js'
import React, { useMemo } from 'react'
import { SvgProps } from 'react-native-svg'

const NetworkSvg: React.FC<{ network: string } & SvgProps> = ({
  network,
  ...props
}) => {
  switch (network) {
    case 'hnt':
      return <Hnt {...props} />
    case 'iot':
      return <Iot {...props} />
    case 'mobile':
      return <Mobile {...props} />
    default:
      return null
  }
}

type Props = {
  position: Partial<PositionWithMeta>
}
export const PositionPreview: React.FC<
  Props & Partial<Omit<ButtonPressAnimationProps, 'position'>>
> = ({ position, ...boxProps }) => {
  // eslint-disable-next-line react/prop-types
  const { info: registrar } = useRegistrar(position.registrar)
  const votingMint = registrar?.votingMints[0].mint
  const network =
    Object.entries(networksToMint).find(
      ([_, mint]) => votingMint && mint.equals(votingMint),
    )?.[0] || 'hnt'
  const { info: mint } = useMint(votingMint)
  // eslint-disable-next-line react/prop-types
  const amount = humanReadable(position.amountDepositedNative, mint?.decimals)
  const { subDaos } = useGovernance()
  const subDao = useMemo(
    () =>
      subDaos?.find(
        (s) =>
          // eslint-disable-next-line react/prop-types
          position.delegatedSubDao && s.pubkey.equals(position.delegatedSubDao),
      ),
    // eslint-disable-next-line react/prop-types
    [subDaos, position.delegatedSubDao],
  )

  // const Icon = <NetworkSvg width={32} height={32} network={network} />
  const Icon = <Hnt width={32} height={32} />
  const delegatedNetwork = subDao?.dntMetadata.json?.symbol.toLowerCase()
  const DelegatedIcon = delegatedNetwork && (
    <NetworkSvg width={18} height={18} network={delegatedNetwork} />
  )

  return (
    <TouchableContainer
      flexDirection="row"
      backgroundColor="surfaceSecondary"
      borderRadius="l"
      alignItems="center"
      p="m"
      mt="s"
      {...boxProps}
    >
      <Box mr="s">{Icon}</Box>
      <Box flexDirection="column">
        <Box flexDirection="row" alignItems="center">
          <Text variant="body3" mr="xxs">
            {amount} {network.toUpperCase()}
          </Text>
          <Text variant="body3" mr="xxs">
            for
          </Text>
          <Text variant="body3" mr="xxs">
            {position.lockup?.endTs
              ? getMinDurationFmt(
                  new BN(Date.now() / 1000),
                  position.lockup?.endTs,
                )
              : null}
          </Text>
          <Text variant="body3" mr="xxs">
            {position.lockup?.kind?.cliff ? 'decaying' : 'decaying delayed'}
          </Text>
        </Box>
        {subDao && (
          <Box mt="xs" flexDirection="row" alignItems="center">
            <Text mr="xs" variant="body3" color="white" opacity={0.5}>
              and delegated to
            </Text>
            <Box mr="xs">{DelegatedIcon}</Box>
            <Text variant="body3">{subDao.dntMetadata.symbol}</Text>
          </Box>
        )}
      </Box>
    </TouchableContainer>
  )
}
