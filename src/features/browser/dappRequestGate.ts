// Runs one dApp request at a time. A request that arrives while another is
// pending is declined at once, so the pending one keeps its sheet and reply.
export const runOneRequest = async (
  pending: { current: boolean },
  decline: () => void,
  run: () => Promise<void>,
) => {
  if (pending.current) {
    decline()
    return
  }
  // eslint-disable-next-line no-param-reassign
  pending.current = true
  try {
    await run()
  } finally {
    // eslint-disable-next-line no-param-reassign
    pending.current = false
  }
}
