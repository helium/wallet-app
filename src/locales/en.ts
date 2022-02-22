export default {
  accountAssign: {
    AccountNamePlaceholder: 'Account Name',
  },
  accountHeader: {
    last24: 'Last 24h',
    timeAgo: 'Updated {{formattedChange}}',
  },
  accountImport: {
    alert: {
      body: "This seed phrase doesn't correspond to a Helium account",
      title: 'Error',
    },
    complete: {
      subtitle: 'This will just take a moment.',
      title: 'Recovering Account...',
    },
    confirm: {
      next: 'Submit Seed Phrase',
      subtitle:
        'Here are the {{totalWords}} words you’ve entered. Tap on any of them if you need to edit.',
      title: 'Please Confirm\nSeed Phrase',
    },
    restoreChoice: 'Restore {{totalWords}} Word Account',
    wordEntry: {
      placeholder: '{{ordinal}} word',
      title:
        "Enter your\naccount's <secondaryText>{{totalWords}} word</secondaryText>\nsecurity key...",
    },
  },
  accountSetup: {
    confirm: {
      forgot: 'I forgot my words',
      subtitle: 'Which word below was your <b>{{ordinal}} word?</b>',
      title: 'Confirm\nYour Words',
    },
    confirmPin: {
      subtitle: 'Re-enter your PIN',
      title: 'Repeat PIN',
    },
    createImport: {
      create: 'Create a new Wallet',
      helperText:
        'Coming from Helium App? Use the same 12\nwords to import a Wallet.',
      import: 'Import a Wallet',
      title: 'What would\nyou like to do?',
    },
    createPin: {
      subtitle: 'Let’s secure your account with a PIN Code.',
      title: 'Set PIN Code',
    },
    passphrase: {
      next: 'I have written these down',
    },
  },
  accountsScreen: {
    allFilterFooter:
      "You've reached the end of your recent activity.\nSelect a filter to view more.",
    filterTypes: {
      all: 'All\nTransactions',
      burn: 'Burn\nTransactions',
      hotspotAndValidators: 'Hotspots &\nValidators',
      mining: 'Mining\nRewards',
      payment: 'Payments',
      pending: 'Pending\nTransactions',
    },
    hideFilters: 'Hide Filters',
    myTransactions: 'My Transactions',
    showFilters: 'Show Filters',
  },
  accountView: {
    balance: 'Balance',
    lock: 'Lock',
    payment: 'Payment',
    request: 'Request',
    send: 'Send',
    stake: 'Stake',
  },
  addNewContact: {
    addContact: 'Add Contact',
    address: {
      placeholder: 'e.g. 9h9h9r3hfi04nf0j083...',
      title: 'Enter Helium Address',
    },
    nickname: {
      placeholder: 'e.g. Loki Laufeyson',
      title: 'Enter Nickname',
    },
    title: 'Add New Contact',
  },
  addressBook: {
    addNext: 'Add New...',
    searchContacts: 'Search Contacts...',
    title: 'Address Book',
  },
  auth: {
    enterCurrent: 'Enter your current PIN to continue',
    error: 'Incorrect PIN',
    signOut: 'Sign Out',
    signOutAlert: {
      body: 'You are signing out of your account. Do you have your 12 recovery words? If you don’t, you will lose access to:\n\n- your Hotspots\n- your HNT\n- your Wallet',
      title: 'Warning!',
    },
    title: 'Enter Your PIN',
  },
  generic: {
    back: 'Back',
    cancel: 'Cancel',
    clear: 'Clear',
    confirm: 'Confirm',
    copied: 'Copied',
    error: 'Error',
    fee: 'Fee',
    next: 'Next',
    ok: 'OK',
    skip: 'Skip',
    success: 'Success',
    total: 'Total',
  },
  hntKeyboard: {
    enterAmount: 'Enter {{ticker}} Amount',
    fee: '+{{value}} Fee ⓘ',
    hntAvailable: '{{amount}} Available',
    validFor: 'valid for {{time}}',
  },
  wifi: {
    authFailed: 'Failed to authorize',
    burnFailed: 'Failed to burn',
    change: 'Change',
    confirmPayment: 'Confirm Payment',
    data: 'Data',
    howMuch: 'How much data do you\nwish to purchase?',
    insufficientFunds: 'Insufficient Funds',
    macFailed: 'Failed to enable mac',
    minutes: 'Minutes',
    remainingBalance: 'Remaining\nBalance',
    youArePurchasing: 'You are purchasing...',
  },
  onboarding: {
    create: '+ New',
    import: '+ Import',
    mainnet: 'Mainnet',
    testnet: 'Testnet',
  },
  ordinals: [
    '1st',
    '2nd',
    '3rd',
    '4th',
    '5th',
    '6th',
    '7th',
    '8th',
    '9th',
    '10th',
    '11th',
    '12th',
    '13th',
    '14th',
    '15th',
    '16th',
    '17th',
    '18th',
    '19th',
    '20th',
    '21st',
    '22nd',
    '23rd',
    '24th',
  ],
  payment: {
    enterAmount: 'Enter {{ticker}} Amount',
    enterMemo: 'Enter Memo (Optional)',
    fee: '+{{value}} Fee',
    max: 'Max',
    memoBytes: '{{used}}/{{total}} Bytes',
    selectContact: 'Select Contact',
    sendButton: 'Swipe to Send {{ticker}}',
    submitError:
      'There was an error submitting this transaction. Please try again.\n\n{{details}}',
    submitSuccess: 'Your payment transaction has been submitted\n\n{{hash}}',
    title: 'Send {{ticker}}',
  },
  placeholder: {
    accountBalanceValue: 'Account Balance: {{balance}}',
    enterAccountAddress: 'Enter Account Address',
    fetchMoreActivity: 'Fetch More Activity',
    getAccountData: 'Get Account Data',
  },
  request: {
    title: 'Generate Request',
  },
  settings: {
    revealWords: {
      next: 'I have written these down',
      subtitle:
        'It is crucial you write all of these\n{{numWords}} words down, in order.\n\nHelium cannot recover these words.',
      title: 'Your {{numWords}} Word\nPassword',
      warning: 'Helium cannot recover these words',
    },
    sections: {
      account: {
        alias: 'Account Alias',
        revealWords: 'Reveal Words',
        signOut: 'Sign Out',
        signOutAlert: {
          body: 'You are signing out of your account {{alias}}. Do you have your recovery words? If you don’t, you will lose access to:\n\n- your HNT\n- your Wallet',
          title: 'Sign Out of {{alias}}',
        },
        title: '{{alias}} Account Settings',
      },
      app: {
        convertHntToCurrency: 'Convert HNT to Currency',
        currency: 'Currency',
        language: 'Language',
        title: 'App Settings',
        version: 'App Version',
      },
      security: {
        authIntervals: {
          after_1_hr: 'After 1 hour',
          after_1_min: 'After 1 minute',
          after_4_hr: 'After 4 hours',
          after_5_min: 'After 5 minutes',
          after_15_min: 'After 15 minutes',
          immediately: 'Immediately',
        },
        enablePin: 'Enable PIN',
        requirePin: 'Require PIN',
        requirePinForPayments: 'Require PIN for Payments',
        resetPin: 'Reset PIN',
        title: 'Security Settings',
      },
    },
    title: 'Settings',
  },
  transactions: {
    added: 'Hotspot Added to Blockchain',
    amount: 'Amount',
    amountToPayee: 'Amount to Payee {{index}}',
    amountToSeller: 'Amount to Seller',
    block: 'Block',
    burnHNT: 'Burn {{ticker}}',
    buyer: 'Buyer',
    date: 'Date',
    feePaidBy: 'Fee paid by {{feePayer}}',
    from: 'From',
    hash: 'Hash',
    hotspot: 'Hotspot',
    location: 'Confirm Location',
    location_v2: 'Update Location',
    memo: 'Memo',
    mining: 'Mining Rewards',
    newAddress: 'New Address',
    newOwner: 'New Owner',
    oldAddress: 'Old Address',
    oldOwner: 'Old Owner',
    owner: 'Owner',
    payee: 'Payee {{index}}',
    pending: {
      inProcess: 'In Process',
      pending: 'Pending',
      sending: 'Payment Sending...',
    },
    received: 'Received {{ticker}}',
    rewardTypes: {
      consensus: 'Consensus',
      data_credits: 'Packet Transfer',
      poc_challengees: 'PoC',
      poc_challengers: 'Challenger',
      poc_witnesses: 'Witness',
      securities: 'Security Tokens',
    },
    securityTokens: 'Security Tokens',
    seller: 'Seller',
    sent: 'Sent {{ticker}}',
    stake: 'Stake',
    stakeAmount: 'Stake Amount',
    stakeValidator: 'Stake {{ticker}}',
    stakingFee: 'Staking Fee',
    totalAmount: 'Total Amount',
    transaction: 'Transaction',
    transfer: 'Hotspot Transfer',
    transferBuy: 'Transfer Hotspot (Buy)',
    transferSell: 'Transfer Hotspot (Sell)',
    transferValidator: 'Transfer Stake',
    txnFee: 'Transaction Fee',
    txnFeePaidBy: 'Transaction Fee paid by {{feePayer}}',
    unstakeValidator: 'Unstake {{ticker}}',
    validator: 'Validator',
  },
}
