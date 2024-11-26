import { useState, useEffect } from 'react'
import CompassHeading from 'react-native-compass-heading'

const useHeading = () => {
  const [heading, setHeading] = useState(0)

  useEffect(() => {
    const degreeUpdateRate = 3

    CompassHeading.start(degreeUpdateRate, ({ heading: newHeading }) => {
      setHeading(newHeading)
    })

    return () => {
      CompassHeading.stop()
    }
  }, [])

  return { heading }
}

export default useHeading
