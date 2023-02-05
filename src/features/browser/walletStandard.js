/* eslint-disable */
const stringF = `async function injectWalletStandard(solanaAddress, pubKey) {
var isConnecting = false

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
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzMxIiBoZWlnaHQ9IjMzMSIgdmlld0JveD0iMCAwIDMzMSAzMzEiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0yMDkuMjk5IDg2LjQ4MzFDMjE4Ljg5IDc2Ljg5NDYgMjM0LjUwMyA3Ni44OTQ2IDI0NC4wOTMgODYuNDgzMUMyNTMuNjg0IDk2LjA3MTUgMjUzLjY4NCAxMTEuNjgyIDI0NC4wOTMgMTIxLjI3QzIzOC41MzggMTI2LjgyNSAyMzAuOTM2IDEyOS4zMzkgMjIzLjIxNyAxMjguMjI4QzIyMi44NjYgMTI4LjE3IDIyMi40NTcgMTI4LjE3IDIyMi4xMDYgMTI4LjIyOEMyMTkuODI1IDEyNy45MzUgMjE3LjQyOCAxMjguMjI4IDIxNS4xNDcgMTI5LjI4QzIxMS45MzEgMTMwLjc0MiAyMDkuNjUgMTMzLjQzMSAyMDguNTM5IDEzNi41M0MyMDcuNDI4IDEzOS41NyAyMDcuNDg3IDE0My4wMiAyMDguOTQ5IDE0Ni4xMTlDMjE3LjE5NCAxNjMuOTUxIDIxMy4zOTMgMTg1LjI5MSAxOTkuNDc1IDE5OS4yMDZDMTg1LjU1OCAyMTMuMTIxIDE2NC4yMTQgMjE2LjkyMSAxNDYuMzc4IDIwOC42NzdDMTQzLjE2MiAyMDcuMjE2IDEzOS43MTIgMjA3LjE1NyAxMzYuNjEzIDIwOC4zMjZDMTMzLjU3MSAyMDkuNDM3IDEzMC45OTggMjExLjcxOCAxMjkuNTM3IDIxNC44NzVDMTI4LjYwMSAyMTYuOTIxIDEyOC4yNSAyMTkuMDI2IDEyOC4zNjcgMjIxLjEzMUMxMjguMzA4IDIyMS41NCAxMjguMzA4IDIyMS45NDkgMTI4LjM2NyAyMjIuMzU5QzEyOS42NTQgMjMwLjE5MyAxMjcuMDgxIDIzOC4yMDMgMTIxLjQ2NyAyNDMuODE2QzExMS44NzcgMjUzLjQwNCA5Ni4yNjM0IDI1My40MDQgODYuNjczIDI0My44MTZDODEuOTk0OSAyMzkuMTM4IDc5LjQ4MDMgMjMyLjk5OSA3OS40ODAzIDIyNi4zOTNDNzkuNDgwMyAyMTkuODQ0IDgyLjA1MzQgMjEzLjY0NyA4Ni42NzMgMjA4Ljk3QzkyLjIyODIgMjAzLjQxNSA5OS44MzA1IDIwMC45MDEgMTA3LjU0OSAyMDIuMDEyQzEwNy42NjYgMjAyLjAxMiAxMDcuNzgzIDIwMi4wMTIgMTA3Ljk1OSAyMDIuMDEyQzEwOC43NzcgMjAyLjE4OCAxMDkuNTk2IDIwMi4zMDUgMTEwLjQ3MyAyMDIuMzA1QzExMi4yODYgMjAyLjMwNSAxMTQuMDk5IDIwMS45NTQgMTE1Ljc5NCAyMDEuMTM1QzExOC45NTIgMTk5LjY3MyAxMjEuMTc0IDE5Ny4xMDEgMTIyLjM0NCAxOTQuMTE5QzEyMy41MTMgMTkxLjAyMSAxMjMuNTEzIDE4Ny41MTIgMTIxLjk5MyAxODQuMjk3QzExMy43NDggMTY2LjQ2NSAxMTcuNTQ5IDE0NS4xMjUgMTMxLjQ2NiAxMzEuMjFDMTQ1LjM4NCAxMTcuMjk1IDE2Ni43MjggMTEzLjQ5NSAxODQuNTYzIDEyMS43MzhDMTg3LjcyMSAxMjMuMiAxOTEuMjMgMTIzLjI1OCAxOTQuMjcxIDEyMi4xNDdDMTk3LjMxMiAxMjEuMDM2IDE5OS45NDMgMTE4Ljc1NyAyMDEuNDA1IDExNS41OTlDMjAyLjUxNiAxMTMuMTQ0IDIwMi44MDkgMTEwLjUxMyAyMDIuMzk5IDEwNy45OTlWMTA3Ljk0QzIwMS4xMTMgMTAwLjEwNiAyMDMuNjg2IDkyLjA5NTcgMjA5LjI5OSA4Ni40ODMxWk0xODQuOTczIDE4NC43MDZDMTk1LjYxNiAxNzQuMDY1IDE5NS42MTYgMTU2LjgxOCAxODQuOTczIDE0Ni4xNzdDMTc0LjMzIDEzNS41MzYgMTU3LjA4IDEzNS41MzYgMTQ2LjQzNyAxNDYuMTc3QzEzNS43OTQgMTU2LjgxOCAxMzUuNzk0IDE3NC4wNjUgMTQ2LjQzNyAxODQuNzA2QzE1Ny4wOCAxOTUuMzQ3IDE3NC4zMyAxOTUuMzQ3IDE4NC45NzMgMTg0LjcwNlpNMTY1LjUgMC44MzAwNzhDMjU2LjQzMiAwLjgzMDA3OCAzMzAuMTcyIDc0LjU1NTggMzMwLjE3MiAxNjUuNDcxQzMzMC4xNzIgMjU2LjM4NiAyNTYuNDkxIDMzMC4xNyAxNjUuNSAzMzAuMTdDNzQuNTA5NiAzMzAuMTcgMC44Mjg2MTMgMjU2LjQ0NCAwLjgyODYxMyAxNjUuNDcxQzAuODI4NjEzIDc0LjQ5NzQgNzQuNTY4IDAuODMwMDc4IDE2NS41IDAuODMwMDc4Wk0yNTMuMjc0IDEzMC40NDlDMjY3LjgzNSAxMTUuODkyIDI2Ny44MzUgOTIuMzI5NSAyNTMuMjc0IDc3Ljc3MThDMjM4LjcxMyA2My4yMTM2IDIxNS4xNDcgNjMuMjEzNiAyMDAuNTg2IDc3Ljc3MThDMTk1LjIwNiA4My4xNTAyIDE5MS44MTUgODkuODE1NCAxOTAuNDExIDk2Ljc3MzNDMTY0LjAzOCA4Ni44MzM3IDEzMy43NDcgOTMuMTQ4MiAxMTMuNTcyIDExMy4zMTlDOTMuMzk3NiAxMzMuNDkgODcuMDgyMSAxNjMuNzc1IDk3LjA4MjEgMTkwLjIwMkM5MC4wNjQ4IDE5MS42MDUgODMuMzk4MSAxOTQuOTk2IDc3Ljk1OTggMjAwLjQzNEM2My4zOTkxIDIxNC45OTIgNjMuMzk5MSAyMzguNTU0IDc3Ljk1OTggMjUzLjExMUM5Mi41MjA1IDI2Ny42NyAxMTYuMDg3IDI2Ny42NyAxMzAuNjQ4IDI1My4xMTFDMTM2LjA4NiAyNDcuNjc0IDEzOS41MzYgMjQwLjg5MiAxNDAuODgxIDIzMy44NzZDMTQ5LjA2OCAyMzYuOTE2IDE1Ny42MDYgMjM4LjQzNyAxNjYuMDg1IDIzOC40MzdDMTg0Ljk3MyAyMzguNDM3IDIwMy42MjcgMjMxLjEyOCAyMTcuNDg2IDIxNy4yNzJDMjM3LjU0NCAxOTcuMjE4IDI0My45MTggMTY3LjEwOCAyMzQuMTUyIDE0MC43NEMyNDEuMTExIDEzOS4yNzggMjQ3LjgzNiAxMzUuODg3IDI1My4yNzQgMTMwLjQ0OVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='

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
        console.log('disconnect')
    },
    signAndSendTransaction: async (transaction) => {
        console.log('transaction', transaction)
        return { signature: 'signature' }
    },
    signTransaction: async (transaction) => {
        console.log('transaction', transaction)
        return { signature: 'signature' }
    },
    signAllTransactions: async (transactions) => {
        console.log('transactions', transactions)
        return transactions
    },
    signMessage: async (message) => {
        console.log('message', message)
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
                window.removeEventListener('message', listener)
                const parsedData = JSON.parse(message.data)
                if (parsedData.type === 'connectDeclined') {
                    isConnecting = false
                    reject(new Error('Connection declined'))
                }
        
                this.#connected()
                resolve({ accounts: this.accounts })
            }
            window.addEventListener('message', listener)
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
                window.removeEventListener('message', listener)
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
            window.addEventListener('message', listener)
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
                window.removeEventListener('message', listener)
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
            window.addEventListener('message', listener)
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
                window.removeEventListener('message', listener)
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
            window.addEventListener('message', listener)
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

window.addEventListener('wallet-standard:app-ready', function (event) {
    window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'app-ready', event: event.data }),
    )
})
}`

module.exports = stringF
