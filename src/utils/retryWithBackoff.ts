export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 5,
  delay = 1000,
): Promise<T> => {
  try {
    return await fn()
  } catch (error: any) {
    if (retries > 0 && error.status === 429) {
      // Check for 429 status code
      // console.warn(`Rate limit hit, retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return retryWithBackoff(fn, retries - 1, delay * 2) // Exponential backoff
    }
    throw error
  }
}
