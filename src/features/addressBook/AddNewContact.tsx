import React, { memo } from 'react'
import ContactDetails from './ContactDetails'

const AddNewContact = () => {
  return <ContactDetails action="add" />
}

export default memo(AddNewContact)
