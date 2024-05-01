import IotSymbol from '@assets/images/iotSymbol.svg'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import { PublicKey } from '@solana/web3.js'
import { useColors } from '@theme/themeHooks'
import { ellipsizeAddress } from '@utils/accountUtils'
import React, { useMemo } from 'react'
import { Mints } from '../utils/constants'
import { HotspotWithPendingRewards } from '../types/solana'

export const HotspotRewardsRecipients = ({
  hotspot,
}: {
  hotspot: HotspotWithPendingRewards
}) => {
  const colors = useColors()
  const mobileRecipient = useMemo(
    () => hotspot?.rewardRecipients?.[Mints.MOBILE],
    [hotspot],
  )

  const iotRecipient = useMemo(
    () => hotspot?.rewardRecipients?.[Mints.IOT],
    [hotspot],
  )

  const hasIotRecipient = useMemo(
    () =>
      iotRecipient?.destination &&
      !new PublicKey(iotRecipient.destination).equals(PublicKey.default),
    [iotRecipient],
  )

  const hasMobileRecipient = useMemo(
    () =>
      mobileRecipient?.destination &&
      !new PublicKey(mobileRecipient.destination).equals(PublicKey.default),
    [mobileRecipient],
  )

  const recipientsAreDifferent = useMemo(
    () =>
      iotRecipient?.destination &&
      mobileRecipient?.destination &&
      !new PublicKey(iotRecipient?.destination).equals(
        new PublicKey(mobileRecipient?.destination),
      ),
    [iotRecipient, mobileRecipient],
  )

  return !recipientsAreDifferent ? (
    <>
      {(hasIotRecipient || hasMobileRecipient) && (
        <Box
          marginTop="s"
          flexDirection="row"
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          gap={4}
        >
          <Box
            flex={1}
            flexDirection="row"
            padding="s"
            backgroundColor="black600"
            borderRadius="m"
            justifyContent="space-between"
            position="relative"
          >
            <Box
              flexDirection="row"
              alignItems="center"
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              gap={8}
            >
              {hasIotRecipient && <IotSymbol color={colors.flamenco} />}
              {hasMobileRecipient && <MobileSymbol color={colors.flamenco} />}
              <Text variant="body2" color="flamenco">
                Recipient
              </Text>
            </Box>
            <Text variant="body1">
              {ellipsizeAddress(
                new PublicKey(
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
                  iotRecipient?.destination!,
                ).toBase58(),
              )}
            </Text>
          </Box>
        </Box>
      )}
    </>
  ) : (
    <Box
      marginTop="s"
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      gap={4}
    >
      {hasIotRecipient && (
        <Box
          flexDirection="row"
          padding="s"
          backgroundColor="black600"
          borderRadius="m"
          justifyContent="space-between"
          position="relative"
        >
          <Box
            flexDirection="row"
            alignItems="center"
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            gap={8}
          >
            <IotSymbol color={colors.flamenco} />
            <Text variant="body2" color="flamenco">
              Recipient
            </Text>
          </Box>
          <Text variant="body1">
            {ellipsizeAddress(
              new PublicKey(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
                iotRecipient?.destination!,
              ).toBase58(),
            )}
          </Text>
        </Box>
      )}
      {hasMobileRecipient && (
        <Box
          flexDirection="row"
          padding="s"
          backgroundColor="black600"
          borderRadius="m"
          justifyContent="space-between"
          position="relative"
        >
          <Box
            flexDirection="row"
            alignItems="center"
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            gap={8}
            l
          >
            <MobileSymbol color={colors.flamenco} />
            <Text variant="body2" color="flamenco">
              Recipient
            </Text>
          </Box>
          <Text variant="body1">
            {ellipsizeAddress(
              new PublicKey(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
                mobileRecipient?.destination!,
              ).toBase58(),
            )}
          </Text>
        </Box>
      )}
    </Box>
  )
}
