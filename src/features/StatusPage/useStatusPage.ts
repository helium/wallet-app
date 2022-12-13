import { useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  STATUS_API_BASE_URL,
  Incident,
  INCIDENT_STATUSES,
  StoredIncident,
  Summary,
} from './statusPageTypes'
import useAppear from '../../hooks/useAppear'
import useMount from '../../hooks/useMount'

const APP_ID = '7sl1km0rgk6r'
const STATUS_KEY = 'statusKey'

function statusPageApi<T>(path: string): Promise<T> {
  return fetch(`${STATUS_API_BASE_URL}${path}`).then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText)
    }
    return response.json() as Promise<T>
  })
}

const fetchUnresolved = () =>
  statusPageApi<{ incidents: Incident[] }>('/incidents/unresolved.json').then(
    (data) => data.incidents,
  )
const fetchSummary = () => statusPageApi<Summary>('/summary.json')

const FETCH_INTERVAL = 5 * 60 * 1000 // 5 minutes

const useStatusPage = () => {
  const [storedIncidents, setStoredIncidents] = useState<StoredIncident[]>([])
  const [summary, setSummary] = useState<Summary>()
  const [unresolved, setUnresolved] = useState<Incident[]>([])
  const [lastFetchTime, setLastFetchTime] = useState(0)

  useMount(() => {
    AsyncStorage.getItem(STATUS_KEY).then((storedIncidentsStr) => {
      if (!storedIncidentsStr) return

      setStoredIncidents(JSON.parse(storedIncidentsStr) as Incident[])
    })
  })

  useAppear(() => {
    if (!summary) {
      fetchSummary().then(setSummary)
    }
    const now = Date.now()
    if (now - FETCH_INTERVAL < lastFetchTime) {
      return
    }

    setLastFetchTime(now)
    fetchUnresolved().then(setUnresolved)
  })

  const incidents = useMemo((): Incident[] => {
    if (!unresolved || !summary) return []

    const component = summary.components.find(({ id }) => id === APP_ID)
    if (!component) return []

    const componentIds = component.components

    const next = unresolved.flatMap((incident) => {
      if (
        // verify this incident belongs to at least one relevant component
        !incident.components.find(({ id }) => componentIds.includes(id)) ||
        // verify the status is one we want to show
        !INCIDENT_STATUSES.includes(incident.status) ||
        // make sure we haven't already shown this incident/status
        storedIncidents.find(
          ({ id, status }) => id === incident.id && status === incident.status,
        )
      ) {
        return []
      }
      return [incident]
    })

    const nextStoredIncidents = [
      ...next.map(({ id, status }) => ({ id, status } as StoredIncident)),
      ...storedIncidents,
    ].slice(0, 20) // limit number of stored incidents. This is just an arbitrary number. May need adjustment.

    AsyncStorage.setItem(STATUS_KEY, JSON.stringify(nextStoredIncidents))

    setStoredIncidents(nextStoredIncidents)

    return next
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, unresolved])

  return incidents
}

export default useStatusPage
