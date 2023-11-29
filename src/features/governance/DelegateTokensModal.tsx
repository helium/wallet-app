import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import { FadeInFast } from '@components/FadeInOut'
import { Portal } from '@gorhom/portal'
import React, { useEffect, useMemo, useState } from 'react'
import Text from '@components/Text'
import SafeAreaBox from '@components/SafeAreaBox'
import Box from '@components/Box'
import { Edge } from 'react-native-safe-area-context'
import { SubDaoWithMeta, useSubDaos } from '@helium/voter-stake-registry-hooks'
import { PublicKey } from '@solana/web3.js'
import CircleLoader from '@components/CircleLoader'
import ButtonPressable from '@components/ButtonPressable'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import TokenIcon from '@components/TokenIcon'

export const DelegateTokensModal = ({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (subDao: SubDaoWithMeta) => Promise<void>
}) => {
  const { loading, error, result: subDaos } = useSubDaos()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSubDaoPk, setSelectedSubDaoPk] = useState<PublicKey | null>(
    null,
  )
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])

  useEffect(() => {
    if (error) {
      console.error(error.message)
    }
  }, [error])

  const handleOnClose = () => {
    onClose()
  }

  const handleSubmit = async () => {
    if (subDaos && selectedSubDaoPk) {
      try {
        setIsSubmitting(true)
        await onSubmit(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          subDaos.find((subDao) => subDao.pubkey.equals(selectedSubDaoPk!))!,
        )
        onClose()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setIsSubmitting(false)
        console.error('Unable to delegate tokens', e.message)
      }
    }
  }

  return (
    <Portal hostName="GovernancePortalHost">
      <ReAnimatedBlurBox
        visible
        entering={FadeInFast}
        position="absolute"
        height="100%"
        width="100%"
      >
        <BackScreen
          padding="none"
          hideBack
          edges={backEdges}
          onClose={handleOnClose}
        >
          <SafeAreaBox
            edges={safeEdges}
            backgroundColor="transparent"
            flex={1}
            padding="m"
            marginHorizontal="s"
            marginVertical="xs"
          >
            <Box flexGrow={1} justifyContent="center">
              <Text textAlign="left" variant="subtitle2" adjustsFontSizeToFit>
                Delegate Tokens
              </Text>
              <Text variant="subtitle4" color="secondaryText" marginBottom="m">
                Select a existing SubDao to delegate to.
              </Text>
              {loading && (
                <Box flexDirection="row" justifyContent="center">
                  <Box marginRight="m">
                    <CircleLoader loaderSize={20} />
                  </Box>
                  <Text
                    variant="subtitle4"
                    color="secondaryText"
                    marginBottom="m"
                  >
                    Fetching SubDaos...
                  </Text>
                </Box>
              )}
              <Box gap="m">
                {subDaos?.map((subDao) => {
                  const isSelected = selectedSubDaoPk?.equals(subDao.pubkey)

                  return (
                    <TouchableOpacityBox
                      key={subDao.pubkey.toString()}
                      borderRadius="l"
                      backgroundColor={
                        isSelected ? 'secondaryBackground' : 'secondary'
                      }
                      onPress={() => setSelectedSubDaoPk(subDao.pubkey)}
                    >
                      <Box flexDirection="row" padding="ms" alignItems="center">
                        <Box
                          borderColor="black"
                          borderWidth={2}
                          borderRadius="round"
                        >
                          <TokenIcon
                            size={26}
                            img={subDao.dntMetadata.json?.image || ''}
                          />
                        </Box>
                        <Text
                          variant="subtitle3"
                          color="primaryText"
                          marginLeft="m"
                        >
                          {subDao.dntMetadata.name}
                        </Text>
                      </Box>
                    </TouchableOpacityBox>
                  )
                })}
              </Box>
            </Box>
          </SafeAreaBox>
        </BackScreen>
        <Box flexDirection="row" padding="m">
          <ButtonPressable
            flex={1}
            fontSize={16}
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            backgroundColorDisabled="surfaceSecondary"
            backgroundColorDisabledOpacity={0.9}
            titleColorDisabled="secondaryText"
            title={isSubmitting ? '' : 'Delegate Tokens'}
            titleColor="black"
            onPress={handleSubmit}
            disabled={!selectedSubDaoPk || isSubmitting}
            TrailingComponent={
              isSubmitting ? <CircleLoader color="white" /> : undefined
            }
          />
        </Box>
      </ReAnimatedBlurBox>
    </Portal>
  )
}
