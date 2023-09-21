import { TldParser } from '@onsol/tldparser'
import { Connection } from '@solana/web3.js'

// retrives AllDomain domain owner.
// the domain must include the dot
export async function fetchDomainOwner(connection: Connection, domain: string) {
  try {
    const parser = new TldParser(connection)
    const owner = await parser.getOwnerFromDomainTld(domain)
    if (!owner) return
    return owner.toBase58()
  } catch (e: any) {
    // Handle the error here if needed
    console.error('Error fetching domain owner:', e)
  }
}
