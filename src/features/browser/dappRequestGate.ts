// The top page's requests carry the token of its injected script; requests
// from any other frame do not
export type RequestSender = 'topFrame' | 'otherFrame'

export type RequestSlots = Record<RequestSender, boolean>

// Runs one dApp request at a time per slot. A request that arrives while its
// slot is held is declined at once, so the pending one keeps its sheet and
// reply. Another frame's request also waits out the top page's, and a top
// page request runs over another frame's: its sheet declines that one.
export const runOneRequest = async (
  slots: RequestSlots,
  sender: RequestSender,
  decline: () => void,
  run: () => Promise<void>,
) => {
  if (slots[sender] || (sender === 'otherFrame' && slots.topFrame)) {
    decline()
    return
  }
  // eslint-disable-next-line no-param-reassign
  slots[sender] = true
  try {
    await run()
  } finally {
    // eslint-disable-next-line no-param-reassign
    slots[sender] = false
  }
}
