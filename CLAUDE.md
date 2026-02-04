# Helium Wallet App

React Native Solana wallet with extensive Helium ecosystem integration.

## Commands

```bash
yarn                    # Install dependencies
yarn pod-install        # iOS pods (run `bundle install` first)
yarn ios                # Run iOS app
yarn android            # Run Android app
yarn lint               # ESLint + TypeScript check
yarn test               # Jest tests
yarn clean-start        # Metro with cache clear
yarn bump-patch         # Version bump (also: bump-minor, bump-major)
```

## Architecture

### Structure
- **Feature-based** - `src/features/` (account, payment, governance, swaps, browser, etc.)
- **Redux Toolkit** - `src/store/slices/` with RTK Query
- **Redux Persist** - app/auth/hotspots/browser slices persisted
- **Shopify Restyle** - theming in `src/theme/`
- **React Navigation v6** - Stack + Bottom Tabs
- **Provider hierarchy** - 17+ nested providers in App.tsx

### Solana/Helium
- `src/solana/` - SolanaProvider, WalletSignProvider, account cache
- 36+ @helium/* packages for SDKs, hooks, IDLs
- Hardware wallets: Ledger (BLE), Keystone (QR)
- Transaction building via @helium/transactions

## Import Aliases

`@components`, `@hooks`, `@utils`, `@theme`, `@storage`, `@types`, `@assets`, `@constants`, `@helium/crypto`

## Code Style

- Airbnb + Prettier (single quotes, no semicolons, trailing commas)
- `_` prefix for unused vars
- Redux slices exempt from param-reassign rule
- console.warn/error allowed, console.log stripped in production
