export default {
  accountAssign: {
    AccountNamePlaceholder: 'Account Name',
    setDefault: 'Set as Default',
    title: 'Name this account',
  },
  accountImport: {
    accountLimit:
      'You have reached the account limit.\nTo add another account, sign out of a wallet account and try again.',
    accountLimitLedger:
      'You have reached the account limit.\nTo add another account, uncheck an account and try again.',
    alert: {
      body: "This seed phrase doesn't correspond to a Helium account",
      title: 'Error',
    },
    cli: {
      alert: {
        body: 'Invalid Password',
        title: 'Password entered is invalid. Please try again.',
      },
      import: {
        body: 'Generate a password-secured QR code in <codeHighlight>helium-wallet-rs</codeHighlight> by typing <codeHighlight>export</codeHighlight>',
        buttonText: 'Scan QR Code',
        title: 'Import CLI',
      },
      password: {
        body: 'Enter the password used to encrypt the CLI Wallet to complete import.',
        buttonText: 'Decrypt and Import',
        title: 'Decrypting Wallet...',
      },
    },
    cliImport: 'CLI',
    complete: {
      subtitle: 'This will just take a moment.',
      title: 'Recovering Account...',
    },
    confirm: {
      next: 'Submit Seed Phrase',
      subtitle:
        'Here are the {{totalWords}} words you’ve entered. Tap on any of them if you need to edit.',
      title: 'Please confirm your seed phrase',
    },
    pickKeyType: 'Pick Security Key Type:',
    recoveryPhrase: 'Secret Phrase',
    subTitle:
      'To import your existing Helium account, enter its <havelockBlue>12</havelockBlue> or <jazzberryJam>24</jazzberryJam> word security key.',
    title: 'Import\nAccount',
    wordEntry: {
      changeWordAmount: 'I have a {{totalWords}}-word recovery phrase',
      placeholder: '{{ordinal}} word',
      title: "Enter your\naccount's 12 or 24\nsecurity words.",
      word: 'Word {{ordinal}}',
    },
  },
  accountSetup: {
    confirm: {
      forgot: 'I forgot my words',
      subtitle: 'Which word below was your',
      subtitleOrdinal: 'What was\nWord {{ordinal}}?',
      title: 'Please confirm your words',
    },
    confirmPin: {
      subtitle: 'Re-enter your PIN',
      title: 'Repeat PIN',
    },
    createButtonTitle: 'Create an Account',
    createImport: {
      create: 'Create a new Wallet',
      helperText:
        'Coming from Helium App? Use the\nsame 12 words to import an Account.',
      import: 'Import a Wallet',
      ledger: 'Pair with Ledger',
      title: 'What would\nyou like to do?',
    },
    createPin: {
      subtitle: 'Let’s secure your account with a PIN Code.',
      title: 'Set PIN Code',
    },
    passphrase: {
      next: 'I have written these down',
      subtitle1:
        'These words represent your private key. Write them down and never share with anyone.',
      subtitle2: 'No one can recover these words',
      title: 'Keep these\nwords safe',
    },
    subtitle1:
      'Every new account is accessed via 24 secure words - your ‘key’.',
    subtitle2:
      'Please ensure these are written down, kept safe, and never shared.',
    title: 'Create New\nAccount',
  },
  accountsScreen: {
    activity: 'Activity',
    allFilterFooter:
      "You've reached the end of your activity.\nSelect a different filter to view more.",
    filter: 'Filter',
    filterTransactions: 'Filter Transactions',
    filterTypes: {
      all: 'All Activity (24h)',
      burn: 'Burn Transactions',
      hotspotAndValidators: 'Hotspots & Validators',
      mining: 'Mining Rewards',
      payment: 'Payments',
      pending: 'Pending Transactions',
    },
    hideFilters: 'Hide Filters',
    myTransactions: 'My Transactions',
    showFilters: 'Show Filters',
    title: 'My {{tokenType}}',
    tokens: 'Tokens',
  },
  accountView: {
    balance: 'Balance',
    fiveG: '5G',
    genesis: 'In Genesis',
    lock: 'Lock',
    nonTransferable: 'Non-Transferable',
    payment: 'Payment',
    request: 'Request',
    securityTokens: 'Security Tokens',
    send: 'Send',
    stake: 'Stake',
    testnetTokens: 'Testnet Tokens',
    vote: 'Vote',
  },
  addNewAccount: {
    title: 'Add New Account',
  },
  addNewContact: {
    addContact: 'Add Contact',
    address: {
      placeholder: 'e.g. 9h9h9r3hfi04nf0j083...',
      title: 'Enter Helium Address',
    },
    loadFailed: 'Cannot validate address. Please try again.',
    nickname: {
      placeholder: 'e.g. Loki Laufeyson',
      title: 'Enter Nickname',
    },
    title: 'Add New Contact',
  },
  addressBook: {
    addNext: 'Add New...',
    qrScanFail: {
      message: 'This QR scanner supports wallet addresses only.',
      title: 'Unsupported QR Code',
    },
    searchContacts: 'Search Contacts...',
    title: 'Address Book',
  },
  auth: {
    enterCurrent: 'Enter your current PIN to continue',
    error: 'Incorrect PIN',
    signOut: 'Sign Out',
    signOutAlert: {
      body: 'You are signing out of all your accounts. Do you have your recovery words? If you don’t, you will lose access to:\n\n- your Address Book\n- your HNT\n- your Wallet',
      title: 'Warning! Sign out of all accounts?',
    },
    title: 'Enter Your PIN',
  },
  burn: {
    amount: 'Amount (HNT)',
    equivalent: 'Equivalent to (DC)',
    ledger: {
      subtitle:
        'Please verify the burn transaction on your Ledger device {{name}}',
      title: 'Ledger Approval',
    },
    memo: 'Memo',
    noAcct: {
      message: 'No account for this network found',
      title: 'Account not found',
    },
    recipient: 'Recipient Address',
    swipeToBurn: 'Swipe to Burn',
    title: 'Burn',
  },
  connectedWallets: {
    add: 'Add New Account',
    addTestnet: 'Add New Testnet Account',
  },
  dappLogin: {
    account: {
      subtitle: 'Which account do you want to authenticate with Crowdspot?',
      title: 'Choose your\nAccount',
    },
    connect: {
      continue: 'Continue',
      subtitle: 'Authenticate Crowdspot\nwith your Helium Wallet?',
      title: 'Connect to {{name}}?',
    },
    error: 'Failed to verify {{app}}',
    ledger: {
      subtitle:
        'You must sign burn transaction to login to {{app}}. Please verify the burn transaction on your Ledger device {{name}}',
      title: 'Ledger Approval',
    },
    login: 'Login',
  },
  editContact: {
    delete: 'Delete',
    deleteConfirmMessage:
      'Are you sure you want to delete your contact, {{alias}}?',
    deleteConfirmTitle: 'Delete Contact?',
    save: 'Save',
    title: 'Edit Contact',
  },
  finePrint: {
    body: 'By continuing, you agree to the',
  },
  generic: {
    account: 'Account',
    and: 'and',
    back: 'Back',
    cancel: 'Cancel',
    clear: 'Clear',
    confirm: 'Confirm',
    copied: 'Copied {{target}}',
    copy: 'Copy',
    error: 'Error',
    fee: 'Fee',
    loadFailed: 'Cannot validate address. Please try again.',
    loading: 'Loading',
    mainnet: 'Mainnet',
    next: 'Next',
    notValidAddress: 'Not a valid Helium Wallet Address.',
    ok: 'OK',
    period: '.',
    retry: 'Retry',
    share: 'Share',
    skip: 'Skip',
    success: 'Success',
    testnet: 'Testnet',
    total: 'Total',
    tryAgain: 'Try Again',
  },
  hntKeyboard: {
    enterAmount: 'Enter {{ticker}} Amount',
    fee: '+{{value}} Fee ⓘ',
    hntAvailable: '{{amount}} Available',
    validFor: 'valid for {{time}}',
  },
  intro: {
    subtitle: 'Setup should only take\na few minutes.',
    tap: 'Get Started',
    title: 'Welcome to\nHelium Wallet',
  },
  ledger: {
    chooseType: {
      bluetooth: {
        title: 'Bluetooth',
        types: 'Nano X',
      },
      title: 'How is your device connected?',
      usb: {
        title: 'USB Cable',
        types: 'Nano S, Nano S Plus, Nano X',
      },
    },
    connectError: {
      steps: [
        'Check network connection',
        'Check Bluetooth is enabled',
        'Open your Ledger device.',
        'Open Helium app on Ledger Device',
      ],
      subtitle:
        'Please check that your Ledger\nDevice is connected to this phone.\n\nIf not, follow these steps:',
      title: 'Pairing Failed',
    },
    deviceNotFound: {
      message:
        'Could not find your ledger device. Please make sure it is connected and the Helium app is open.',
      title: 'Device Not Found',
    },
    pairStart: {
      pair: 'Pair with Ledger',
      subtitle:
        'Tap the button below to\nsearch for nearby Ledger\nWallets to link with.',
      title: 'Pair Ledger\nto Wallet',
    },
    payment: {
      subtitle:
        'Please verify the payment transaction on your Ledger device {{name}}',
      title: 'Ledger Approval',
    },
    scan: {
      connectionError: 'Ledger Connection Error',
      permissionDialog: {
        later: 'Ask Me Later',
        message:
          'Location permission is needed to enable a bluetooth connection',
        title: 'Location Permission',
      },
      subtitle:
        'Please make sure your\nLedger is unlocked with\nbluetooth enabled',
      subtitleUsb:
        'Please make sure your\nLedger is unlocked and\nconnected via USB',
      title: 'Looking\nfor Devices',
    },
    show: {
      accountsAlreadyLinked: 'Accounts Already Linked ({{count}})',
      addNewAccount: 'Add New Account',
      alias: 'Ledger Account {{accountIndex}}',
      close: 'Close',
      deselectAll: 'Deselect All',
      emptyAccount:
        "Can't add a new account before you've received assets on your {{account}}",
      help: 'Verify that the address shown on the Ledger device matches.',
      next: 'Import Account(s)',
      selectAll: 'Select All',
      subtitle:
        'This Ledger device can authorize transactions for the below Helium Account. ',
      title: 'Select Accounts',
    },
    start: {
      help: 'How does it work?',
      next: 'Pair with Ledger',
      subtitle:
        'Please make sure your Ledger is unlocked with Bluetooth enabled',
      title: 'Pair with Ledger',
    },
    success: {
      next: 'View Account',
      subtitle: 'Your Ledger account is now available in your Helium Wallet.',
      title: 'Ledger Paired Successfully',
    },
  },
  linkWallet: {
    body: 'By Linking Helium Wallet to {{appName}}, you can safely sign blockchain transactions without re-entering your seed phrase.',
    no: 'No, Cancel',
    testnet: {
      message: 'Linking requires a mainnet account.',
      title: 'Accounts not found',
    },
    title: 'Link Helium Wallet\nto {{appName}}?',
    yes: 'Yes, Link my Wallet',
  },
  notifications: {
    accountUpdates: '{{title}} Updates',
    emptyTitle: 'No Notifications',
    heliumUpdates: 'Helium Updates',
    title: 'Notifications',
    walletUpdates: 'Wallet Updates',
  },
  onboarding: {
    create: 'New',
    import: 'Import',
    ledger: 'Ledger',
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
    addRecipient: '+ Add Recipient',
    backToAccounts: 'Back to Accounts',
    enterAddress: 'Enter Address',
    enterAmount: 'Enter {{ticker}} Amount',
    enterMemo: 'Enter Memo (Optional)',
    fee: '+{{value}} Fee',
    insufficientFunds: 'Insufficient {{token}}',
    ledgerTooManyRecipients:
      'Ledger payment transactions\nare limited to 1 recipient.',
    max: 'Max',
    memoBytes: '{{used}}/{{total}} Bytes',
    mobilePrompt: {
      message:
        "Sending MOBILE has a small transaction fee that's paid from your HNT balance. If you have a 0 HNT balance, the payment will not succeed.",
      title: 'MOBILE Payment',
    },
    netTypeQrError: "No accounts support the scanned address's network type.",
    pay: 'Pay',
    qrScanFail: {
      message:
        'This QR scanner supports payment transactions and wallet addresses.',
      title: 'Unsupported QR Code',
    },
    selectContact: 'Select Contact',
    selfPay: 'Self Pay',
    send: 'Send',
    sendButton: 'Swipe to Send {{ticker}}',
    senderAccount: 'Sender Account',
    sending: 'Sending...',
    submitError:
      'There was an error submitting this transaction. Please try again.\n\n{{details}}',
    submitFailed: 'Transaction\nFailed',
    submitSuccess: 'Transaction\nSubmitted',
    title: 'Send {{ticker}}',
    total: 'Total',
    totalRecipients: '{{count}} Recipient',
    totalRecipients_one: '{{count}} Recipient',
    totalRecipients_other: '{{count}} Recipients',
    totalRecipients_plural: '{{count}} Recipients',
    wrongNetType: 'Wrong Net Type',
  },
  placeholder: {
    accountBalanceValue: 'Account Balance: {{balance}}',
    enterAccountAddress: 'Enter Account Address',
    fetchMoreActivity: 'Fetch More Activity',
    getAccountData: 'Get Account Data',
  },
  qrScanner: {
    deniedAlert: {
      message:
        'Camera permissions denied. To re-enable, go to your phone’s settings.',
      ok: 'Go to Settings',
      title: 'Camera Disabled',
    },
  },
  request: {
    amount: 'Amount (Optional)',
    copied: 'Link has been copied to your clipboard',
    enterAmount: 'Enter {{ticker}} Amount',
    link: 'Deeplink',
    memo: 'Memo',
    payee: 'Payee',
    qr: 'QR',
    requestType: 'Request {{ticker}}',
    title: 'Generate Request',
  },
  restoreAccount: {
    alert: {
      button12: '12 Words',
      button24: '24 Words',
      message: 'Does your account {{address}} have 12 or 24 security words?',
      title: 'Restore Account',
    },
    errorAlert: {
      message:
        'The words you entered do not match the account you are restoring.',
      title: 'Error Restoring Account',
    },
    missing: 'Account has no private key. Tap to restore.',
    missingAlert: {
      button1: 'Restore account with 12-24 Words',
      message:
        'Your private key for account {{address}} is missing and must be restored.',
      title: 'Private Key Not Found',
    },
  },
  settings: {
    confirmSignout: {
      forgotAlert: {
        body: 'Would you like to reveal your accounts words?',
        title: 'Reveal Words',
      },
      title: 'Confirm Your\nWords To Sign Out',
    },
    revealPrivateKey: {
      alertMessage:
        "This will access and display your private key from your device's secure storage",
      alertTitle: 'Are you sure?',
      done: 'Done',
      subtitle:
        '<secondaryText>Do not share your private key!</secondaryText><red500>\n\nIf someone has your private key they will have full control of your wallet!</red500>',
      tap: 'Tap to reveal your private key',
      title: 'Your Private Key',
    },
    revealWords: {
      next: 'I have written these down',
      subtitle:
        '<secondaryText>It is crucial you write all of these\n{{numWords}} words down, in order.</secondaryText><red500>\n\nHelium cannot recover these words.</red500>',
      title: 'Your {{numWords}} Word\nPassword',
      warning: 'Helium cannot recover these words',
    },
    sections: {
      account: {
        alias: 'Account Alias',
        copyAddress: 'Copy Address',
        revealWords: 'Reveal Words',
        shareAddress: 'Share Address',
        signOut: 'Sign Out',
        signOutAlert: {
          body: 'You are signing out of your account, {{alias}}. Do you have your recovery words? If you don’t, you will lose access to:\n\n- your HNT\n- your Wallet',
          bodyLastAccount:
            'You are signing out of your only account, {{alias}}. Do you have your recovery words? If you don’t, you will lose access to:\n\n- your Address Book\n- your HNT\n- your Wallet',
          iCloudMessage:
            '\n\nAny device using the same iCloud account will also be signed out.',
          title: 'Sign Out of {{alias}}?',
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
      backup: {
        revealPrivateKey: 'Reveal Private Key',
        revealWords: 'Reveal Words',
        title: '{{alias}} Account Backup',
      },
      defaultAccount: {
        disableMessage:
          'Wallet app requires a default account. Select a different account by tapping its account settings to set as default.',
        disableTitle: 'Default Account Required',
        enableMessage:
          'This will update your default account from {{aliasOld}} to {{aliasNew}}. You can update this in Settings later if you change your mind.',
        enableTitle: 'Update Default Account?',
        title: 'Default Account',
      },
      dev: {
        testnet: {
          enablePrompt: {
            getTnt: 'Get TNT',
            message:
              'Importing and Creating Testnet accounts enabled. To acquire TNT (Testnet tokens), go to faucet.helium.wtf.',
            title: 'Enable Testnet Access',
          },
          helperText: 'To disable Testnet, signout of of\nall Testnet accounts',
          title: 'Enable Testnet',
        },
        title: 'Developer Settings',
      },
      finePrint: {
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service',
        title: 'The Fine Print',
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
      shareAddress: {
        copiedToClipboard: 'Copied {{address}} to clipboard',
      },
    },
    title: 'Settings',
  },
  signHotspot: {
    elevation: 'Elevation:',
    error: {
      subtitle:
        'Unable to add this Hotspot to the Helium Network. Contact {{maker}} to troubleshoot this issue.',
      takeMeBack: 'Go Back to {{maker}}',
      title: 'Invalid Link',
    },
    gain: 'Gain:',
    location: 'Location:',
    maker: 'Maker:',
    name: 'Hotspot Name:',
    newOwner: 'New Owner:',
    owner: 'Owner:',
    title: 'Add Hotspot to\nBlockchain?',
    titleLocationOnly: 'Update Location?',
    titleTransfer: 'Transfer Hotspot?',
  },
  statusBanner: {
    description: 'Last updated {{date}}. Tap for info.',
  },
  transactions: {
    added: 'Hotspot Added to Blockchain',
    addToAddressBook: {
      message: 'Would you like to add this wallet to your address book?',
      title: 'Add to Address Book',
    },
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
    iotRewards: 'IOT Rewards',
    location: 'Confirm Location',
    location_v2: 'Update Location',
    memo: 'Memo',
    mining: 'Mining Rewards',
    mobileRewards: 'Mobile Rewards',
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
      overages: 'Overages',
      poc_challengees: 'PoC',
      poc_challengers: 'Challenger',
      poc_witnesses: 'Witness',
      securities: 'Security Tokens',
    },
    seller: 'Seller',
    sent: 'Sent {{ticker}}',
    stake: 'Stake',
    stakeAmount: 'Stake Amount',
    stakeValidator: 'Stake {{ticker}}',
    stakingFee: 'Staking Fee',
    tokens: 'Tokens',
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
  vote: {
    active: 'Active Votes',
    against: 'Against',
    backToVoting: 'Back to Voting',
    blocksLeft: 'Blocks left',
    blocksSinceVote: 'Blocks\nsince Vote',
    body: 'To cast a vote, submit a burn transaction using the wallet of your choosing. Total cost of a burn transaction is {{dcValue}} or approximately {{usdValue}}.',
    burnTitle: 'Burn {{ticker}}',
    closed: 'Closed Votes',
    deadline: 'Deadline',
    estimatedTimeRemaining: 'Est. Time Remaining',
    estimatedTimeRemainingNewline: 'Est. Time\nRemaining',
    finalResults: 'Final Results',
    for: 'For',
    ledger: {
      subtitle:
        'Please verify the burn transaction on your Ledger device {{name}}',
      title: 'Ledger Approval',
    },
    noHNT: 'You must hold HNT to vote.',
    preliminaryResults: 'Preliminary Results',
    subtitle:
      '<primaryText>Welcome to Helium Vote</primaryText>\n\nVote <greenBright500>For</greenBright500> or <blueBright500>Against</blueBright500> proposed Helium Improvement Proposals by burning HNT.',
    swipeToVote: 'Swipe to Vote',
    title: 'Helium Vote',
    totalVotes: 'Total\nVotes',
    tutorial: {
      goToVote: 'Go To Vote',
      slides: [
        {
          body: 'Helium Vote is where the\nHelium Community comes\ntogether to make decisions\non the Network.',
          title: 'Helium Vote',
        },
        {
          body: 'Each Vote is driven by a\nHelium Improvement\nProposal (HIP).',
          title: 'HIPs',
        },
        {
          body: 'Each HIP will have two\nvoting choices. Vote <greenBright500>For</greenBright500> or\n<blueBright500>Against</blueBright500> by submitting a\nburn transaction.\n\nBurn transactions have a\nsmall fee.',
          title: 'How to Vote',
        },
        {
          body: 'Your <primaryText>Vote Power</primaryText>\nis determined by the amount of\nHNT in the account at the\nend of the vote.',
          title: 'Vote Power',
        },
        {
          body: '<caribbeanGreen>Get your voice heard.</caribbeanGreen>\n\nVote on Active Votes or\nbrowse Closed Votes.',
          title: 'Ready to Vote?',
        },
      ],
    },
    vote: 'Vote',
    voteClosed: 'Vote\nClosed',
    voteCount: '{{totalVotes}} Votes',
    voteOptions: 'Vote Options',
    votes: 'Votes',
    votingAs: 'Voting as {{alias}} with {{hnt}} Voting Power',
    votingClosed: 'Voting Closed',
    votingClosedNewline: 'Voting\nClosed',
  },
}
