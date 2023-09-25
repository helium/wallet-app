import { TldParser } from '@onsol/tldparser'
import { Connection, PublicKey } from '@solana/web3.js'
import { resolve } from '@bonfida/spl-name-service'

// retrives AllDomain domain owner.
// the domain must include the dot
export async function fetchDomainOwner(connection: Connection, domain: string) {
  try {
    let owner: PublicKey | undefined
    if (domain.endsWith('.sol')) {
      owner = await resolve(connection, domain)
    } else {
      const parser = new TldParser(connection)
      owner = await parser.getOwnerFromDomainTld(domain)
    }
    if (!owner) return
    return owner.toBase58()
  } catch (e: any) {
    // Handle the error here if needed
    console.error('Error fetching domain owner:', e)
  }
}
