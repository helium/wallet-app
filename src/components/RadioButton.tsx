import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import React from 'react'

type RadioButtonProps = {
  label: string
  selected: boolean
  onClick: () => void
}

const RadioButton: React.FC<RadioButtonProps> = ({
  label,
  selected,
  onClick,
}) => {
  return (
    <Box
      mt="l"
      flexDirection="row"
      alignItems="flex-start"
      justifyContent="flex-start"
    >
      <TouchableOpacityBox
        mr="s"
        height={20}
        width={20}
        borderRadius="round"
        borderWidth={2}
        borderColor="blueBright500"
        alignItems="center"
        justifyContent="center"
        onPress={() => onClick()}
      >
        <Box
          width={10}
          height={10}
          borderRadius="round"
          backgroundColor={selected ? 'blueBright500' : 'transparent'}
        />
      </TouchableOpacityBox>
      <Text width="90%" onPress={() => onClick()} color="white">
        {label}
      </Text>
    </Box>
  )
}

export default RadioButton
