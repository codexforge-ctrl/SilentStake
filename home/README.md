# SilentStake Frontend

The front-end application exposes SilentStake's encrypted points flow:

- Claim a one-time allocation of encrypted points
- Stake and withdraw encrypted amounts through Zama's relayer SDK
- Decrypt balances locally using a typed-data signature

## Getting Started

```bash
npm install
npm run dev
```

Open the app, connect a wallet on Sepolia, and paste the deployed SilentStake contract address in the **Contract address** card. The dApp uses viem for reads and ethers for writes.

Encryption features require the Zama relayer SDK from `@zama-fhe/relayer-sdk/bundle`. The hooks keep the SDK initialisation in React state and never rely on environment variables, local storage, or TailwindCSS.
