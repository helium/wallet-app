import Hnt from '@assets/images/hnt.svg'
import Iot from '@assets/images/iot.svg'
import Mobile from '@assets/images/mobile.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableContainer, {
  ButtonPressAnimationProps,
} from '@components/TouchableContainer'
import { EPOCH_LENGTH } from '@helium/helium-sub-daos-sdk'
import { PositionWithMeta } from '@helium/voter-stake-registry-hooks'
import { useGovernance } from '@storage/GovernanceProvider'
import { getMinDurationFmt, getTimeLeftFromNowFmt } from '@utils/dateTools'
import { humanReadable } from '@utils/formatting'
import BN from 'bn.js'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  position: PositionWithMeta
}

export const PositionPreview: React.FC<
  Props & Partial<Omit<ButtonPressAnimationProps, 'position'>>
> = ({ position, ...boxProps }) => {
  const { t } = useTranslation()
  const { subDaos, network, mintAcc } = useGovernance()
  const { lockup, isDelegated, hasGenesisMultiplier, votingMint } = position
  const lockupKind = Object.keys(lockup.kind)[0] as string
  const isConstant = lockupKind === 'constant'

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
    <NetworkSvg width={14} height={14} network={delegatedNetwork} />
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
      <Box flexDirection="column" justifyContent="space-around">
        {hasGenesisMultiplier && (
          <Box flexDirection="row" alignItems="center" gap="xs">
            <Text variant="body3" color="primaryText" textAlign="right">
              {t('gov.positions.landrush')}
            </Text>
            <Text variant="body3" color="primaryText" textAlign="right">
              {votingMint.genesisVotePowerMultiplier}x (
              {getTimeLeftFromNowFmt(lockup.endTs)})
            </Text>
          </Box>
        )}
        <Box flexDirection="row" alignItems="center">
          <Text variant="body3" mr="xxs">
            {amount} {network.toUpperCase()}
          </Text>
          <Text variant="body3" mr="xxs">
            for
          </Text>
          <Text variant="body3" mr="xxs">
            {isConstant
              ? getMinDurationFmt(lockup.startTs, lockup.endTs)
              : isDelegated
              ? getTimeLeftFromNowFmt(lockup.endTs.add(new BN(EPOCH_LENGTH)))
              : getTimeLeftFromNowFmt(lockup.endTs)}
          </Text>
          <Text variant="body3" mr="xxs">
            {isConstant ? 'decaying delayed' : 'decaying'}
          </Text>
        </Box>
        {subDao && (
          <Box flexDirection="row" alignItems="center">
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
