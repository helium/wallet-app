import { useEffect, useState } from 'react'

// Returns the clock time from mount, re-read once when endTsSeconds passes
const useNowAfter = (endTsSeconds?: number): number => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (endTsSeconds === undefined) return
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.max(endTsSeconds * 1000 - Date.now(), 0),
    )
    return () => clearTimeout(timer)
  }, [endTsSeconds])
  return now
}

export default useNowAfter
