import { Check } from 'lucide-react-native'
import React, { FC } from 'react'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'

const CheckIcon = withUniwind(Check)

// The selection checkbox shared by the hotspot and token edit sheets: one
// size, one border treatment, and an actual check glyph in the checked state
// so a filled box doesn't read as a color swatch.
const WorldCheckbox: FC<{ checked: boolean }> = ({ checked }) => (
  <View
    className={
      checked
        ? 'size-[22px] items-center justify-center rounded-[4px] bg-purple-700'
        : 'size-[22px] items-center justify-center rounded-[4px] border-[1.5px] border-muted-foreground'
    }
  >
    {checked ? (
      <CheckIcon size={14} strokeWidth={3} colorClassName="accent-white" />
    ) : null}
  </View>
)

export default WorldCheckbox
