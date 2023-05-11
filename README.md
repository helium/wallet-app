<h3 align="center">
  <image src="https://raw.githubusercontent.com/helium/wallet-app/main/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png" alt="wallet-logo" height="100" />
  <br/>
  <h3 align="center">Helium Wallet App</h3>
</h3>

## About

Welcome to the `wallet app`, an **open-source** Solana wallet designed for the Helium ecosystem. With this app, you can manage your accounts and identity on the Helium network, view transactions, import multiple accounts, and even vote.

The app also comes with a handy address book, allowing you to save commonly used wallet addresses for quick access. Plus, you can send multiple Helium currencies to multiple recipients simultaneously.

You can also view and claim hotspot rewards within the app, as well as explore various dApps with the embedded browser.

We hope you enjoy using the wallet app and all of its convenient features!

## Installation

In order to interact with any package contained in this repository you will need to install the following:

- [**NVM**](https://github.com/nvm-sh/nvm/blob/master/README.md)
- [**Homebrew**](https://brew.sh/)
- [**Node.js@16.x.x**](https://nodejs.org/) `16.x.x`
- [**Yarn**](https://www.npmjs.com/package/yarn)
- [**Cocoapods**](https://cocoapods.org/)
- [**Xcode**](https://developer.apple.com/xcode/) `14.2`
  - [Download older versions of Xcode here](https://developer.apple.com/download/all/?q=xcode%2014.2)
- [**Android Studio**](https://developer.android.com/studio) `Chipmunk`
  - [Download older versions of Android Studio here](https://developer.android.com/studio/archive)
  - [Install a Virtual Device](https://developer.android.com/studio/run/emulator#avd) (`Nexus 5` with `UpsideDownCake` good default)
  - When [installing the Android SDK](https://reactnative.dev/docs/environment-setup#android-sdk) use these:
  - `Android 12.0`
    - `Android SDK Platform 31`
  - `Android SDK Build-Tools 34-rc4` -> `33.0.0`

### Set up your development environment

Follow the instructions for "React Native CLI Quickstart" found [here](https://reactnative.dev/docs/environment-setup)

### Step by Step guide on getting started:

- Install Command line developer tools **MAC ONLY**
- Install Homebrew
  ```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  ```
- Install NVM
  ```bash
  brew install nvm
  ```
- Add the following to `~/.bash_profile` or `~/.zshrc` and open a new shell
  ```bash
  source $(brew --prefix nvm)/nvm.sh
  ```
- Install Node Version 16
  ```bash
  nvm install 16
  ```
- Set Node version to 16
  ```bash
  nvm use 16
  ```
- Install Yarn
  ```bash
  npm install -g yarn
  ```
- Install Rosetta **M1 & M2 ONLY**
  ```bash
  softwareupdate --install-rosetta
  ```
- Install Cocoapods (if cocoapods is not already installed, the `uninstall` commands will fail, thats ok)
  ```bash
  gem cleanup
  brew uninstall cocoapods
  sudo gem uninstall cocoapods
  sudo gem install cocoapods -v 1.10.1 -n /usr/local/bin
  ```
- Clone the repository
  ```bash
  git clone https://github.com/helium/wallet-app.git
  cd wallet-app
  ```
- Install dependencies
  ```bash
  yarn
  ```
- Install Pods
  ```bash
  yarn pod-install
  ```
- Start the ios app
  ```bash
  yarn ios
  ```
  - If you get this pop-up, click `OK` and let the build continue.
    ![Unable To Boot Pop up](/readme/ios-yarn-build-unable-to-boot.png)
- Start the android app
  ```bash
  yarn android
  ```

### Short guide for those who are familiar with the above tools:

```bash
git clone https://github.com/helium/wallet-app.git
cd wallet-app
yarn
yarn pod-install
```

For iOS:

```bash
yarn ios
```

For Android:

```bash
yarn android
```

## Usage

**Important: All the commands should be run at the root of the repo.**

### Tools

Our [**React Native app**](https://reactnative.dev/docs/getting-started) is built using [**TypeScript**](https://www.typescriptlang.org/docs/) and utilizes the [**Shopify/Restyle**](https://github.com/Shopify/restyle) library for styling. We manage our dependencies using [**Yarn**](https://yarnpkg.com/), a fast and reliable package manager. Shopify/Restyle provides a set of pre-built UI components and style primitives, making it easy to create beautiful and responsive user interfaces. It offers a great starting point for building a custom UI, while also offering the flexibility to customize and extend the existing components.

### Root scripts

The scripts that are defined inside the root [`/package.json`](https://github.com/helium/wallet-app/blob/main/package.json)

## Contributing

Please check the general guidelines for contributing to the wallet app: [`CONTRIBUTING.md`](https://github.com/helium/wallet-app/blob/main/CONTRIBUTING.md).

In the meantime here are some important highlights:

- Follow the git workflow, prefix your branches and do not create unneeded merge commits.
- Be mindful when creating Pull Requests, specify the reason of the change clearly and write tests if needed.
- Wallet app is mostly accepting bugfix contributions. For features we may reject them based on the fact that they do not fit our roadmap or our long-term goals.

## License

Please check each project `LICENSE` file, most of them are under the `MIT` license.

## Notes
