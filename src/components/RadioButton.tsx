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
      mt="6"
      flexDirection="row"
      alignItems="flex-start"
      justifyContent="flex-start"
    >
      <TouchableOpacityBox
        mr="2"
        height={20}
        width={20}
        borderRadius="full"
        borderWidth={2}
        borderColor="text.quaternary-500"
        alignItems="center"
        justifyContent="center"
        onPress={() => onClick()}
      >
        <Box
          width={10}
          height={10}
          borderRadius="full"
          backgroundColor={selected ? 'base.black' : 'transparent'}
        />
      </TouchableOpacityBox>
      <Text
        variant="textSmRegular"
        width="90%"
        onPress={() => onClick()}
        color="primaryText"
      >
        {label}
      </Text>
    </Box>
  )
}

export default RadioButton
