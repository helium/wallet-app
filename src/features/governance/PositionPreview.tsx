import Hnt from '@assets/svgs/hnt.svg'
import Iot from '@assets/svgs/iot.svg'
import Mobile from '@assets/svgs/mobile.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableContainer, {
  ButtonPressAnimationProps,
} from '@components/TouchableContainer'
import { PositionWithMeta } from '@helium/voter-stake-registry-hooks'
import { useGovernance } from '@config/storage/GovernanceProvider'
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
  const { subDaos, network, mintAcc } = useGovernance()
  const amount = humanReadable(
    position.amountDepositedNative,
    mintAcc?.decimals,
  )
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

  const Icon = <NetworkSvg width={32} height={32} network={network} />
  const delegatedNetwork = subDao?.dntMetadata.json?.symbol.toLowerCase()
  const DelegatedIcon = delegatedNetwork && (
    <NetworkSvg width={18} height={18} network={delegatedNetwork} />
  )

  return (
    <TouchableContainer
      flexDirection="row"
      backgroundColor="bg.tertiary"
      borderRadius="2xl"
      alignItems="center"
      p="4"
      mt="2"
      {...boxProps}
    >
      <Box mr="2">{Icon}</Box>
      <Box flexDirection="column">
        <Box flexDirection="row" alignItems="center">
          <Text variant="textXsRegular" mr="0.5">
            {amount} {network.toUpperCase()}
          </Text>
          <Text variant="textXsRegular" mr="0.5">
            for
          </Text>
          <Text variant="textXsRegular" mr="0.5">
            {position.lockup?.endTs
              ? getMinDurationFmt(
                  new BN(Date.now() / 1000),
                  position.lockup?.endTs,
                )
              : null}
          </Text>
          <Text variant="textXsRegular" mr="0.5">
            {position.lockup?.kind?.cliff ? 'decaying' : 'decaying delayed'}
          </Text>
        </Box>
        {subDao && (
          <Box mt="xs" flexDirection="row" alignItems="center">
            <Text
              mr="xs"
              variant="textXsRegular"
              color="primaryText"
              opacity={0.5}
            >
              and delegated to
            </Text>
            <Box mr="xs">{DelegatedIcon}</Box>
            <Text variant="textXsRegular">{subDao.dntMetadata.symbol}</Text>
          </Box>
        )}
      </Box>
    </TouchableContainer>
  )
}
