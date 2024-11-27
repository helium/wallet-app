import axios, { AxiosError } from 'axios'

export const handleAxiosError = (e: unknown, verbose = true) => {
  if (axios.isAxiosError(e)) {
    const axiosError = e as AxiosError
    const data = JSON.stringify(axiosError.response?.data, null, 2)
    const status = axiosError.response?.status || axiosError.status
    const { message } = axiosError
    const url = axiosError.config?.url

    let errMessage = message
    if (verbose) {
      errMessage = `Request ${url} failed: \nData: ${data}\nStatus: ${status}\nMessage: ${message}`
    }
    // logger.breadcrumb(errMessage)

    // eslint-disable-next-line no-console
    console.error(axiosError.request)
    return errMessage
  }
  const msg = (e as Error).message || 'Unknown error'
  //   logger.breadcrumb(msg)
  return msg
}
