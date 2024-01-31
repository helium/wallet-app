/* eslint-disable */
const stringF = `async function injectWalletStandard(solanaAddress, pubKey, isAndroid) {
var isConnecting = false
var parent = isAndroid ? document : window

class PublicKey {
    constructor(publicKey) {
        this.publicKey = publicKey
    }

    toBytes() {
        return this.publicKey
        // return base58.decode(this.publicKey)
    }

    toBuffer() {
        return this.publicKey
        // return base58.decode(this.publicKey);
    }

    toBase58() {
        return this.publicKey
    }

    toString() {
        return this.toBase58()
    }

    equals(newPublicKey) {
        return this.toString() === newPublicKey.toString()
    }
}

// This is copied from @solana/wallet-standard-chains
/** Solana Mainnet (beta) cluster, e.g. https://api.mainnet-beta.solana.com */
const SOLANA_MAINNET_CHAIN = 'solana:mainnet'
/** Solana Devnet cluster, e.g. https://api.devnet.solana.com */
const SOLANA_DEVNET_CHAIN = 'solana:devnet'
/** Solana Testnet cluster, e.g. https://api.testnet.solana.com */
const SOLANA_TESTNET_CHAIN = 'solana:testnet'
/** Solana Localnet cluster, e.g. http://localhost:8899 */
const SOLANA_LOCALNET_CHAIN = 'solana:localnet'
/** Array of all Solana clusters */
const SOLANA_CHAINS = [
    SOLANA_MAINNET_CHAIN,
    SOLANA_DEVNET_CHAIN,
    SOLANA_TESTNET_CHAIN,
    SOLANA_LOCALNET_CHAIN,
]
/**
 * Check if a chain corresponds with one of the Solana clusters.
 */
function isSolanaChain(chain) {
    return SOLANA_CHAINS.includes(chain)
}

// This is copied with modification from @wallet-standard/wallet
const chains = SOLANA_CHAINS

const features = [
    'solana:signAndSendTransaction',
    'solana:signTransaction',
    'solana:signMessage',
    'solana:connect',
    'solana:connected',
    'solana:disconnect'
]

const icon =
    'data:image/png;base64,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'

// This is copied from @wallet-standard/wallet
function bytesEqual(a, b) {
    return arraysEqual(a, b)
}

function arraysEqual(a, b) {
    if (a === b) return true
    const { length } = a
    if (length !== b.length) return false
    for (let i = 0; i < length; i++) {
        if (a[i] !== b[i]) return false
    }
    return true
}

class HeliumWalletAccount {
    #address

    #publicKey

    #chains

    #features

    #label

    #icon

    get address() {
        return this.#address
    }

    get publicKey() {
        return this.#publicKey.slice()
    }

    get chains() {
        return this.#chains.slice()
    }

    get features() {
        return this.#features.slice()
    }

    get label() {
        return this.#label
    }

    get icon() {
        return this.#icon
    }

    constructor({ address, publicKey, label, icon }) {
        if (new.target === HeliumWalletAccount) {
            Object.freeze(this)
        }
        this.#address = address
        this.#publicKey = publicKey
        this.#chains = chains
        this.#features = features
        this.#label = label
        this.#icon = icon
    }
}

const wallet = {
    publicKey: solanaAddress,
    connect: () => { return { publicKey: solanaAddress } },
    disconnect: async () => {
    },
    signAndSendTransaction: async (transaction) => {
        return { signature: 'signature' }
    },
    signTransaction: async (transaction) => {
        return { signature: 'signature' }
    },
    signAllTransactions: async (transactions) => {
        return transactions
    },
    signMessage: async (message) => {
        return { signature: message }
    },
    on: () => { },
    off: () => { },
}

const p = new PublicKey(wallet.publicKey)

class HeliumWallet {
    #listeners = {}

    #version = '1.0.0'

    #name = 'Helium'

    #icon = icon

    #account = null

    #url = 'https://helium.com'

    #helium

    get version() {
        return this.#version
    }

    get name() {
        return this.#name
    }

    get icon() {
        return this.#icon
    }

    get url() {
        return this.#url
    }

    get features() {
        return {
            'standard:connect': {
                version: '1.0.0',
                connect: this.#connect,
            },
            'standard:disconnect': {
                version: '1.0.0',
                disconnect: this.#disconnect,
            },
            'standard:events': {
                version: '1.0.0',
                on: this.#on,
            },
            'solana:signAndSendTransaction': {
                version: '1.0.0',
                supportedTransactionVersions: ['legacy', 0],
                signAndSendTransaction: this.#signAndSendTransaction,
            },
            'solana:signTransaction': {
                version: '1.0.0',
                supportedTransactionVersions: ['legacy', 0],
                signTransaction: this.#signTransaction,
            },
            'solana:signMessage': {
                version: '1.0.0',
                signMessage: this.#signMessage,
            },
            'helium:': {
                helium: this.#helium,
            },
        }
    }

    get accounts() {
        return this.#account ? [this.#account] : []
    }

    constructor(helium) {
        if (new.target === HeliumWallet) {
            Object.freeze(this)
        }
        this.#helium = helium
    }

    #on = (event, listener) => {
        this.#listeners[event]?.push(listener) ||
            (this.#listeners[event] = [listener])
        return () => this.#off(event, listener)
    }

    #emit(event, ...args) {
        this.#listeners[event]?.forEach((listener) => listener.apply(null, args))
    }

    #off(event, listener) {
        this.#listeners[event] = this.#listeners[event]?.filter(
            (existingListener) => listener !== existingListener,
        )
    }

    #connected = () => {
        const address = this.#helium.publicKey
        if (address) {
            const account = this.#account
            if (isConnecting && (!account || account.address !== address || !bytesEqual(solanaAddress, pubKey))) {
                isConnecting = false
                this.#account = new HeliumWalletAccount({ address, publicKey: pubKey })
                this.#emit('change', { accounts: this.accounts })
            }
        }
    }

    #disconnected = () => {
        if (this.#account) {
            this.#account = null
            this.#emit('change', { accounts: this.accounts })
        }
    }

    #reconnected = () => {
        if (this.#helium.publicKey) {
            this.#connected()
        } else {
            this.#disconnected()
        }
    }

    #connect = async ({ silent } = {}) => {
        isConnecting = true
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'connect' }))

        return new Promise((resolve, reject) => {
            const listener = (message) => {
              // Metamask provider sends some weird objects that we don't use
              if (typeof message.data == "string") {
                parent.removeEventListener('message', listener)
                const parsedData = JSON.parse(message.data)
                if (parsedData.type === 'connectDeclined') {
                    isConnecting = false
                    reject(new Error('Connection declined'))
                }
      
                this.#connected()
                resolve({ accounts: this.accounts })
              }
            }
            parent.addEventListener('message', listener)
        })
    }

    #disconnect = async () => {
        this.#disconnected()
    }

    #signAndSendTransaction = async (...inputs) => {
        if (!this.#account) throw new Error('not connected')
        const outputs = []

        window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'signAndSendTransaction', inputs }),
        )

        return new Promise((resolve, reject) => {
            const listener = (message) => {
              // Metamask provider sends some weird objects that we don't use
              if (typeof message.data == "string") {
                parent.removeEventListener('message', listener)
                const parsedData = JSON.parse(message.data)
                if (parsedData.type === 'signatureDeclined') {
                    reject(new Error('Signature declined'))
                }
                const { data } = JSON.parse(message.data)

                const signatures = data.map(({ signature }) => {
                    return {
                        signature: new Uint8Array(Object.keys(signature).map((key) => {
                            return signature[key]
                        })),
                    }
                })

                resolve(signatures)
              }
            }
            parent.addEventListener('message', listener)
        })
    }

    #signTransaction = async (...inputs) => {
        if (!this.#account) throw new Error('not connected')
        const outputs = []

        window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'signTransaction', inputs }),
        )

        return new Promise((resolve, reject) => {
            const listener = (message) => {
              // Metamask provider sends some weird objects that we don't use
              if (typeof message.data == "string") {
                parent.removeEventListener('message', listener)
                const parsedData = JSON.parse(message.data)
                if (parsedData.type === 'signatureDeclined') {
                    reject(new Error('Signature declined'))
                }
                const { data } = JSON.parse(message.data)

                const signedTxns = data.map(({ signedTransaction }) => {
                    return {
                        signedTransaction: Object.keys(signedTransaction).map((key) => {
                            return signedTransaction[key]
                        }),
                    }
                })
                resolve(signedTxns)
              }
            }
            parent.addEventListener('message', listener)
        })
    }

    #signMessage = async (...inputs) => {
        if (!this.#account) throw new Error('not connected')
        const outputs = []
        window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'signMessage', inputs }),
        )

        return new Promise((resolve, reject) => {
            const listener = (message) => {
              // Metamask provider sends some weird objects that we don't use
              if (typeof message.data == "string") {
                parent.removeEventListener('message', listener)
                const parsedData = JSON.parse(message.data)
                if (parsedData.type === 'signatureDeclined') {
                    reject(new Error('Signature declined'))
                }
                const { data } = JSON.parse(message.data)

                const signedMessages = data.map(({ signature, signedMessage }) => {
                    return {
                        signedMessage: new Uint8Array(signedMessage),
                        signature: new Uint8Array(Object.keys(signature).map((key) => {
                            return signature[key]
                        })),
                    }
                })
                
                resolve(signedMessages)
              }
            }
            parent.addEventListener('message', listener)
        })
    }
}

window.heliumWallet = wallet
const walletObj = new HeliumWallet(wallet)

const registerEvent = new CustomEvent('wallet-standard:register-wallet', {
    bubbles: false,
    cancelable: false,
    composed: false,
    detail: ({ register }) => register(walletObj),
})

window.dispatchEvent(registerEvent)

// Attach the reference to the window, guarding against errors.
try {
    Object.defineProperty(window, 'heliumWallet', { value: wallet })
} catch (error) {
    console.error(error)
}

parent.addEventListener('wallet-standard:app-ready', function (event) {
    event.detail.register(walletObj)
})
}`

module.exports = stringF
