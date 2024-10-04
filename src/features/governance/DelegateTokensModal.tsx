import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import { FadeInFast } from '@components/FadeInOut'
import { Portal } from '@gorhom/portal'
import React, { useEffect, useMemo, useState } from 'react'
import Text from '@components/Text'
import Box from '@components/Box'
import { Edge } from 'react-native-safe-area-context'
import { SubDaoWithMeta, useSubDaos } from '@helium/voter-stake-registry-hooks'
import { PublicKey } from '@solana/web3.js'
import CircleLoader from '@components/CircleLoader'
import ButtonPressable from '@components/ButtonPressable'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import TokenIcon from '@components/TokenIcon'
import { useTranslation } from 'react-i18next'

export const DelegateTokensModal = ({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (subDao: SubDaoWithMeta) => Promise<void>
}) => {
  const { t } = useTranslation()
  const { loading, error, result: subDaos } = useSubDaos()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transactionError, setTransactionError] = useState()
  const [selectedSubDaoPk, setSelectedSubDaoPk] = useState<PublicKey | null>(
    null,
  )
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
        setTransactionError(e.message || t('gov.errors.delegatePositions'))
      }
    }
  }

  const showError = useMemo(() => {
    if (transactionError) return transactionError
  }, [transactionError])

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
          hideBack
          edges={backEdges}
          onClose={handleOnClose}
          backgroundColor="transparent"
          flex={1}
          padding="4"
          marginHorizontal="2"
        >
          <Box flexGrow={1} justifyContent="center">
            {!loading && (
              <>
                <Text
                  textAlign="left"
                  variant="textLgMedium"
                  adjustsFontSizeToFit
                >
                  {t('gov.transactions.delegatePosition')}
                </Text>
                <Text
                  variant="textSmMedium"
                  color="secondaryText"
                  marginBottom="4"
                >
                  {t('gov.positions.selectSubDao')}
                </Text>
              </>
            )}
            {loading && (
              <Box justifyContent="center" alignItems="center">
                <CircleLoader loaderSize={20} />
                <Text
                  variant="textSmMedium"
                  color="secondaryText"
                  marginTop="3"
                >
                  {t('gov.positions.fetchingSubDaos')}
                </Text>
              </Box>
            )}
            <Box>
              {subDaos
                ?.sort((a, b) =>
                  a.dntMetadata.name.localeCompare(b.dntMetadata.name),
                )
                .map((subDao, idx) => {
                  const isSelected = selectedSubDaoPk?.equals(subDao.pubkey)

                  return (
                    <TouchableOpacityBox
                      key={subDao.pubkey.toString()}
                      borderRadius="2xl"
                      marginTop={idx > 0 ? '4' : 'none'}
                      backgroundColor={
                        isSelected ? 'secondaryBackground' : 'bg.tertiary'
                      }
                      onPress={() => setSelectedSubDaoPk(subDao.pubkey)}
                    >
                      <Box flexDirection="row" padding="3" alignItems="center">
                        <Box
                          borderColor="base.black"
                          borderWidth={2}
                          borderRadius="full"
                        >
                          <TokenIcon
                            size={26}
                            img={subDao.dntMetadata.json?.image || ''}
                          />
                        </Box>
                        <Text
                          variant="textMdMedium"
                          color="primaryText"
                          marginLeft="4"
                        >
                          {subDao.dntMetadata.name}
                        </Text>
                      </Box>
                    </TouchableOpacityBox>
                  )
                })}
            </Box>
          </Box>
          {showError && (
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              paddingTop="3"
            >
              <Text variant="textXsMedium" color="ros.500">
                {showError}
              </Text>
            </Box>
          )}
          <Box flexDirection="row" paddingTop="4">
            <ButtonPressable
              flex={1}
              fontSize={16}
              borderRadius="full"
              backgroundColor="base.white"
              backgroundColorOpacityPressed={0.7}
              backgroundColorDisabled="bg.tertiary"
              backgroundColorDisabledOpacity={0.9}
              titleColorDisabled="secondaryText"
              title={isSubmitting ? '' : 'Delegate Tokens'}
              titleColor="base.black"
              onPress={handleSubmit}
              disabled={!selectedSubDaoPk || isSubmitting}
              TrailingComponent={
                isSubmitting ? <CircleLoader color="primaryText" /> : undefined
              }
            />
          </Box>
        </BackScreen>
      </ReAnimatedBlurBox>
    </Portal>
  )
}
