import React from 'react'
import Box from './Box'
import TouchableOpacityBox from './TouchableOpacityBox'
import Text from './Text'
import Close from '../assets/images/close.svg'
import { useColors } from '../theme/themeHooks'

export type ModalScreenProps = {
  children: React.ReactNode
  onClose: () => void
  title: string
}

const ModalScreen = ({ children, onClose, title }: ModalScreenProps) => {
  const colors = useColors()
  return (
    <Box flex={1}>
      <Box
        backgroundColor="secondaryBackground"
        height={60}
        justifyContent="center"
        alignItems="center"
        flexDirection="row"
      >
        <TouchableOpacityBox
          padding="l"
          position="absolute"
          left={0}
          onPress={onClose}
        >
          <Close color={colors.white} width={16} height={16} />
        </TouchableOpacityBox>
        <Text variant="subtitle1" textAlign="center">
          {title}
        </Text>
      </Box>
      {children}
    </Box>
  )
}

export default ModalScreen
