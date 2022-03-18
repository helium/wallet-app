import React, { memo } from 'react'
import { RouteProp, useRoute } from '@react-navigation/native'
import { AddressBookStackParamList } from './addressBookTypes'
import ContactDetails from './ContactDetails'

type Route = RouteProp<AddressBookStackParamList, 'EditContact'>

const EditContact = () => {
  const route = useRoute<Route>()
  const { contact } = route.params

  return <ContactDetails action="edit" contact={contact} />
}

export default memo(EditContact)
