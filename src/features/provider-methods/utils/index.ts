import axios from 'axios'
import cheerio from 'react-native-cheerio'

export type ConnectMethod = {
  app_url: string
  dapp_encryption_public_key: string
  redirect_link: string
  cluster?: string
}

export type DisconnectMethod = {
  dapp_encryption_public_key: string
  nonce: string
  redirect_link: string
  payload: string
  /** Encrypted JSON string with the following structure:
   * {
   * "session": "...", // token received from connect-method
   * }
   */
}

export type SignAndSendTransactionMethod = {
  dapp_encryption_public_key: string
  nonce: string
  redirect_link: string
  payload: string
  /** Encrypted JSON string with the following structure:
   * {
   * "transaction": "...", // serialized transaction, base58-encoded
   * "sendOptions": "..." // an optional Solana web3.js sendOptions object
   * "session": "...", // token received from the connect method
   * }
   *
   * transaction (required): The transaction that Helium will sign and submit, serialized and encoded in base58.
   * sendOptions (optional): An optional object that specifies options for how Helium should submit the transaction. This object is defined in Solana web3.js.
   * session (required): The session token received from the Connect method.
   */
}

export type SignAllTransactionsMethod = {
  dapp_encryption_public_key: string
  nonce: string
  redirect_link: string
  payload: string
  /** Encrypted JSON string with the following structure:
   * {
   * "transactions": "...", // serialized transactions, base58 encoded
   * "session": "...", // token received from connect-method
   * }
   * transactions (required): An array of serialized transactions, encoded in base58.
   * session (required): The session token received from the Connect method.
   */
}

export type SignTransactionMethod = {
  dapp_encryption_public_key: string
  nonce: string
  redirect_link: string
  payload: string
  /** Encrypted JSON string with the following structure:
   * {
   * "transaction": "...", // serialized transaction, base58 encoded
   * "session": "...", // token received from connect-method
   * }
   */
}

export type SignMessageMethod = {
  dapp_encryption_public_key: string
  nonce: string
  redirect_link: string
  payload: string
  /** Encrypted JSON string with the following structure:
   * {
   * "message": "...", // the message, base58 encoded
   * "session": "...", // token received from connect-method
   * "display": "utf8" | "hex", // the encoding to use when displaying the message
   * }
   * message (required): The message that should be signed by the user, encoded in base58. Helium will display this message to the user when they are prompted to sign.
   * session (required): The session token received from the Connect method. Please see Handling Sessions for more details.
   * display (optional): How you want us to display the string to the user. Defaults to utf8
   */
}

/**
 * Extracts metadata (title and icon) from a given URL
 * @param {string} url - The URL to scrape
 * @returns {Promise<Object>} An object containing extracted title and icon
 */
export const extractWebMetadata = async (url: string) => {
  try {
    // Fetch the webpage content
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    // Parse the HTML content
    const $ = cheerio.load(response.data)

    // Title Extraction
    let title: string | null | undefined = null

    // Primary lookup: Open Graph title
    title = $('meta[property="og:title"]').attr('content')

    // Secondary lookup: Document title (if Open Graph title not found)
    if (!title) {
      title = $('title').text().trim()
    }

    // Icon Extraction
    let icon: string | null | undefined = null

    // Primary lookup: Apple touch icon
    icon = $('link[rel="apple-touch-icon"]').attr('href')

    // Secondary lookup: Favicon
    if (!icon) {
      icon =
        $('link[rel="icon"]').attr('href') ||
        $('link[rel="shortcut icon"]').attr('href')
    }

    // Resolve relative URLs
    if (icon && !icon.startsWith('http')) {
      const urlObj = new URL(url)
      icon = new URL(icon, urlObj.origin).href
    }

    return {
      title: title || null,
      icon: icon || null,
    }
  } catch {
    return {
      title: null,
      icon: null,
    }
  }
}

export default extractWebMetadata
