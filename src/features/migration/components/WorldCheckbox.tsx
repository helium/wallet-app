import CheckIco from '@assets/images/checkIco.svg'
import Box from '@components/Box'
import React, { FC } from 'react'

// The World-Light selection checkbox shared by the hotspot and token edit
// sheets: one size, one border treatment, and an actual check glyph in the
// checked state so a filled box doesn't read as a color swatch.
const WorldCheckbox: FC<{ checked: boolean }> = ({ checked }) => (
  <Box
    width={22}
    height={22}
    borderRadius="s"
    backgroundColor={checked ? 'worldPurple' : 'transparent'}
    borderWidth={checked ? 0 : 1.5}
    borderColor="worldSecondaryInk"
    alignItems="center"
    justifyContent="center"
  >
    {checked ? <CheckIco color="white" width={11} height={8} /> : null}
  </Box>
)

export default WorldCheckbox
