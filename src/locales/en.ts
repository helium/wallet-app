export default {
  generic: {
    clear: 'Clear',
    cancel: 'Cancel',
    ok: 'OK',
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
  ],
  placeholder: {
    enterAccountAddress: 'Enter Account Address',
    getAccountData: 'Get Account Data',
    accountBalanceValue: 'Account Balance: {{balance}}',
    fetchMoreActivity: 'Fetch More Activity',
  },
  account_setup: {
    welcome: {
      create_account: 'Create an Account',
      import_account: 'Import Existing Account',
    },
    passphrase: {
      next: 'I have written these down',
    },
    confirm: {
      title: 'Confirm\nYour Words',
      subtitle: 'Which word below was your <b>{{ordinal}} word?</b>',
      forgot: 'I forgot my words',
    },
    create_pin: {
      title: 'Set PIN Code',
      subtitle: 'Let’s secure your account with a PIN Code.',
    },
    confirm_pin: {
      title: 'Repeat PIN',
      subtitle: 'Re-enter your PIN',
    },
  },
  account_import: {
    word_entry: {
      title: 'Enter Recovery\nSeed Phrase',
      directions: 'Enter the <b>{{ordinal}}</b> Word',
      placeholder: '{{ordinal}} word',
      subtitle: 'Recovery Seed Phrases are not\ncase-sensitive',
    },
    confirm: {
      title: 'Please Confirm\nSeed Phrase',
      subtitle:
        'Here are the 12 words you’ve entered. Tap on any of them if you need to edit.',
      next: 'Submit Seed Phrase',
    },
    complete: {
      title: 'Recovering Account...',
      subtitle: 'This will just take a moment.',
    },
    alert: {
      title: 'Error',
      body: "This seed phrase doesn't correspond to a Helium account",
    },
  },
  auth: {
    title: 'Enter Your PIN',
    error: 'Incorrect PIN',
    enter_current: 'Enter your current PIN to continue',
    signOut: 'Sign Out',
    signOutAlert: {
      title: 'Warning!',
      body: 'You are signing out of your account. Do you have your 12 recovery words? If you don’t, you will lose access to:\n\n- your Hotspots\n- your HNT\n- your Wallet',
    },
  },
}
