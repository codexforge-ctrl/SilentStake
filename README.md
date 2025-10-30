# SilentStake

A privacy-preserving points and staking system built on Fully Homomorphic Encryption (FHE) using Zama's FHEVM protocol. SilentStake enables users to manage points, stake, and withdraw while keeping all balances and transaction amounts completely private on-chain.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Advantages](#advantages)
- [Technology Stack](#technology-stack)
- [Problems Solved](#problems-solved)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Future Roadmap](#future-roadmap)

---

## Overview

SilentStake is a next-generation points and staking protocol that leverages Fully Homomorphic Encryption (FHE) to provide complete privacy for all user balances and transaction amounts. Unlike traditional blockchain applications where all data is visible on-chain, SilentStake performs computations on encrypted data, ensuring that sensitive information remains confidential while maintaining the security and transparency guarantees of blockchain technology.

The protocol implements a simple yet powerful points system where:
- Users can claim an initial allocation of encrypted points
- Points can be staked to earn rewards or participate in governance
- Staked points can be withdrawn back to the available balance
- All balances and amounts remain encrypted end-to-end

## Key Features

### Complete Privacy
- **Encrypted Balances**: All user balances are stored as encrypted values on-chain using euint64 (64-bit encrypted unsigned integers)
- **Private Transactions**: Transaction amounts for staking and withdrawals are encrypted, preventing MEV and front-running attacks
- **Confidential Point Claims**: Even the initial point claims are processed through FHE operations
- **Zero-Knowledge Operations**: Mathematical operations (addition, subtraction, comparisons) are performed directly on encrypted data without decryption

### Secure Operations
- **Access Control**: Only authorized users can decrypt their own balances
- **Insufficient Balance Protection**: Encrypted balance checks prevent overdrafts without revealing actual balances
- **One-Time Claims**: Built-in protection against duplicate point claims
- **Atomic State Updates**: All balance changes are executed atomically to prevent race conditions

### User-Friendly Design
- **Simple Interface**: Clean API with three main operations: claim, stake, and withdraw
- **Event Emission**: Transaction events for off-chain tracking while maintaining privacy
- **View Functions**: Query encrypted balances that can only be decrypted by authorized parties
- **Hardhat Tasks**: Pre-built CLI tasks for easy interaction with the contract

## Advantages

### Privacy Advantages
1. **MEV Resistance**: Since transaction amounts are encrypted, MEV bots cannot extract value by reordering transactions
2. **Competition Protection**: Competitors cannot analyze your staking strategies or balance positions
3. **User Privacy**: Protect users from surveillance and profiling based on on-chain activity
4. **Financial Confidentiality**: Sensitive financial information remains private while staying verifiable

### Technical Advantages
1. **On-Chain Computation**: Unlike zero-knowledge proofs, FHE allows direct computation on encrypted data
2. **No Trusted Setup**: FHEVM doesn't require trusted setup ceremonies
3. **Composability**: Encrypted values can be passed between different smart contracts
4. **Standard EVM**: Runs on standard EVM-compatible chains with FHEVM support

### Business Advantages
1. **Regulatory Compliance**: Enables privacy while maintaining auditability for authorized parties
2. **Enterprise Ready**: Suitable for sensitive business applications requiring confidentiality
3. **Competitive Edge**: First-mover advantage in privacy-preserving DeFi applications
4. **User Trust**: Enhanced privacy builds user confidence and adoption

## Technology Stack

### Core Technologies
- **Solidity 0.8.27**: Latest Solidity version with Cancun EVM features
- **FHEVM by Zama**: Fully Homomorphic Encryption Virtual Machine for confidential smart contracts
- **Hardhat**: Ethereum development environment for compiling, testing, and deploying
- **TypeScript**: Type-safe development for tests and deployment scripts
- **Ethers.js v6**: Modern Ethereum library for blockchain interactions

### FHEVM Components
- **@fhevm/solidity**: Core FHE library providing encrypted types (euint64) and operations
- **@fhevm/hardhat-plugin**: Hardhat integration for FHE development and testing
- **encrypted-types**: Type definitions for encrypted data structures
- **@zama-fhe/oracle-solidity**: Decryption oracle for authorized data revelation
- **@zama-fhe/relayer-sdk**: SDK for interacting with FHE relayers

### Development Tools
- **hardhat-deploy**: Deployment management and contract versioning
- **TypeChain**: TypeScript bindings for smart contracts
- **Chai & Mocha**: Testing framework with FHE-specific matchers
- **Hardhat Gas Reporter**: Gas usage analysis and optimization
- **Solidity Coverage**: Code coverage analysis for smart contracts
- **ESLint & Prettier**: Code quality and formatting tools

### Network Support
- **Local Development**: Hardhat Network with FHEVM mock environment
- **Sepolia Testnet**: Ethereum testnet deployment with Infura RPC
- **Mainnet Ready**: Architecture prepared for production deployment

## Problems Solved

### 1. On-Chain Privacy Problem
**Problem**: Traditional blockchains expose all transaction data publicly, making it easy to track user behavior, balances, and trading strategies.

**Solution**: SilentStake encrypts all sensitive data using FHE, ensuring that only authorized parties can view decrypted information while still allowing smart contract logic to execute correctly.

### 2. MEV and Front-Running
**Problem**: Transparent transaction pools allow miners and bots to front-run transactions or extract MEV by reordering operations based on visible amounts.

**Solution**: Encrypted transaction amounts prevent malicious actors from determining transaction value, eliminating the economic incentive for front-running.

### 3. Staking Privacy
**Problem**: Public staking amounts reveal user wealth and strategies, exposing them to targeted attacks, social engineering, or unwanted attention.

**Solution**: Both available and staked balances are encrypted, hiding user positions while still enabling verifiable staking operations.

### 4. Balance Verification Without Exposure
**Problem**: Proving sufficient balance typically requires revealing the actual balance amount.

**Solution**: FHE comparison operations (FHE.ge) allow the contract to verify sufficient balance in encrypted form, only updating state if the condition passes.

### 5. Regulatory Compliance vs. Privacy
**Problem**: Many jurisdictions require financial transparency while users demand privacy.

**Solution**: Encrypted data can be selectively revealed to authorized auditors or regulators using FHE permission systems, balancing privacy and compliance.

### 6. Composable Private Transactions
**Problem**: Existing privacy solutions (mixers, ZK-proofs) often break composability or require complex off-chain computations.

**Solution**: FHEVM encrypted values can be passed between contracts and composed naturally, maintaining both privacy and DeFi composability.

## How It Works

### Encryption Flow

1. **Client-Side Encryption**
   - User inputs a plaintext amount (e.g., 40 points to stake)
   - FHEVM client library encrypts the value using the contract's public key
   - Encrypted input with cryptographic proof is submitted on-chain

2. **On-Chain Computation**
   - Contract receives encrypted amount and validates the proof
   - Performs FHE operations (addition, subtraction, comparison) on encrypted data
   - All intermediate values remain encrypted throughout execution
   - State updates use encrypted values directly

3. **Authorized Decryption**
   - Only the user who owns the balance can decrypt their encrypted values
   - Permission system (FHE.allow) grants decryption rights selectively
   - Off-chain decryption happens client-side with user's private key

### Core Operations

#### Claim Points
```solidity
function claim() external
```
- Initializes user's encrypted balances to zero if first interaction
- Adds 100 encrypted points to the user's balance
- Marks the user as having claimed to prevent duplicates
- Grants decryption permissions to the user

#### Stake Points
```solidity
function stake(externalEuint64 amountHandle, bytes calldata inputProof) external
```
- Accepts encrypted amount with cryptographic proof
- Checks if user has sufficient balance (encrypted comparison)
- If sufficient: decreases balance and increases staked amount
- If insufficient: leaves balances unchanged (no revert, silent failure)
- Updates encrypted state atomically

#### Withdraw Points
```solidity
function withdraw(externalEuint64 amountHandle, bytes calldata inputProof) external
```
- Accepts encrypted withdrawal amount with proof
- Checks if user has sufficient staked balance (encrypted comparison)
- If sufficient: decreases staked balance and increases available balance
- If insufficient: leaves balances unchanged
- Maintains privacy throughout the operation

### Privacy Guarantees

- **Balance Privacy**: No one except the user can see actual balance amounts
- **Transaction Privacy**: Stake/withdraw amounts are hidden from observers
- **Computation Privacy**: All arithmetic happens on encrypted data
- **Conditional Privacy**: Even the results of balance checks remain encrypted
- **Event Privacy**: Events emit encrypted handles, not plaintext values

## Architecture

### Smart Contract Structure

```
SilentStake.sol
├── State Variables
│   ├── balances: mapping(address => euint64)           // Encrypted available points
│   ├── stakedBalances: mapping(address => euint64)     // Encrypted staked points
│   └── hasClaimed: mapping(address => bool)            // Claim tracking
├── Public Functions
│   ├── claim()                                          // Claim initial points
│   ├── stake(euint64, bytes)                           // Stake encrypted points
│   ├── withdraw(euint64, bytes)                        // Withdraw staked points
│   ├── balanceOf(address) → euint64                    // Query encrypted balance
│   ├── stakedBalanceOf(address) → euint64              // Query encrypted staked
│   └── hasClaimedPoints(address) → bool                // Check claim status
└── Private Helpers
    ├── _addEncrypted()                                  // FHE addition
    ├── _subEncrypted()                                  // FHE subtraction
    ├── _shareWithAccount()                              // Grant decryption rights
    └── _ensureInitializedBalances()                     // Initialize encrypted zeros
```

### Project Structure

```
SilentStake/
├── contracts/
│   └── SilentStake.sol                    // Main FHE-enabled staking contract
├── deploy/
│   └── deploy.ts                          // Hardhat deployment script
├── tasks/
│   ├── accounts.ts                        // Account management tasks
│   └── SilentStake.ts                     // Contract interaction tasks
│       ├── task:address                   // Get deployed contract address
│       ├── task:claim                     // Claim initial points
│       ├── task:stake                     // Stake encrypted points
│       ├── task:withdraw                  // Withdraw staked points
│       └── task:decrypt-balances          // Decrypt user balances
├── test/
│   ├── SilentStake.ts                     // Local Hardhat tests
│   └── SilentStakeSepolia.ts             // Sepolia testnet integration tests
├── hardhat.config.ts                      // Hardhat & FHEVM configuration
├── package.json                           // Dependencies and scripts
└── tsconfig.json                          // TypeScript configuration
```

### Testing Architecture

**Unit Tests (Local)**
- Mock FHEVM environment for fast iteration
- User decryption simulation for balance verification
- Multi-user scenarios (deployer, alice, bob)
- Edge case testing (insufficient balance, double claims)

**Integration Tests (Sepolia)**
- Real FHEVM network interactions
- End-to-end encryption/decryption flows
- Gas cost analysis
- Network-specific behavior validation

## Quick Start

For detailed instructions see:
[FHEVM Hardhat Quick Start Tutorial](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   Create a `.env` file at the project root:

   ```env
   PRIVATE_KEY=<hex_private_key_without_0x>
   INFURA_API_KEY=<infura_project_id>
   ETHERSCAN_API_KEY=<optional_for_verification>
   ```

   The deployment scripts require a raw private key (no mnemonic support).

3. **Compile and test**

   ```bash
   npm run compile
   npm run test
   ```

4. **Deploy to local network**

   ```bash
   # Start a local FHEVM-ready node
   npx hardhat node
   # Deploy to local network
   npx hardhat deploy --network localhost
   ```

5. **Deploy to Sepolia Testnet**

   ```bash
   # Deploy to Sepolia
   npx hardhat deploy --network sepolia
   # Verify contract on Etherscan
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

6. **Test on Sepolia Testnet**

   ```bash
   # Once deployed, you can run a simple test on Sepolia.
   npx hardhat test --network sepolia
   ```

## Usage Examples

### Deploying the Contract

**Local Deployment**
```bash
# Start local FHEVM-ready node
npx hardhat node

# Deploy to local network (in another terminal)
npx hardhat deploy --network localhost
```

**Sepolia Testnet Deployment**
```bash
# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Interacting via Hardhat Tasks

**Get Contract Address**
```bash
npx hardhat task:address
# Output: SilentStake address: 0x...
```

**Claim Initial Points**
```bash
npx hardhat task:claim --network sepolia
# Wait for tx: 0x...
# Status: 1
```

**Stake Encrypted Points**
```bash
npx hardhat task:stake --value 40 --network sepolia
# Encrypts 40 points and stakes them
# Wait for tx: 0x...
# Status: 1
```

**Withdraw Staked Points**
```bash
npx hardhat task:withdraw --value 20 --network sepolia
# Encrypts 20 points and withdraws from stake
# Wait for tx: 0x...
# Status: 1
```

**Decrypt Your Balances**
```bash
npx hardhat task:decrypt-balances --network sepolia
# Decrypted balance: 60
# Decrypted staked balance: 20
```

### Programmatic Usage

**TypeScript Example**
```typescript
import { ethers, fhevm } from "hardhat";
import { SilentStake } from "../types";

// Get contract instance
const contract = await ethers.getContractAt("SilentStake", contractAddress) as SilentStake;

// Claim points
const claimTx = await contract.claim();
await claimTx.wait();

// Stake encrypted amount
const encryptedInput = await fhevm
  .createEncryptedInput(contractAddress, signer.address)
  .add64(50)  // Stake 50 points
  .encrypt();

const stakeTx = await contract.stake(
  encryptedInput.handles[0],
  encryptedInput.inputProof
);
await stakeTx.wait();

// Query encrypted balance
const balanceHandle = await contract.balanceOf(signer.address);

// Decrypt balance (requires authorization)
const balance = await fhevm.userDecryptEuint(
  FhevmType.euint64,
  balanceHandle,
  contractAddress,
  signer
);
console.log(`Balance: ${balance}`);
```

### Testing

**Run Local Tests**
```bash
# Run all tests with mock FHEVM
npm test

# Run specific test file
npx hardhat test test/SilentStake.ts

# Run with gas reporting
REPORT_GAS=true npm test
```

**Run Integration Tests on Sepolia**
```bash
# Test on live testnet
npm run test:sepolia
```

**Coverage Analysis**
```bash
npm run coverage
# Generates coverage report in coverage/index.html
```

## 📜 Available Scripts

| Script             | Description              |
| ------------------ | ------------------------ |
| `npm run compile`  | Compile all contracts    |
| `npm run test`     | Run all tests            |
| `npm run coverage` | Generate coverage report |
| `npm run lint`     | Run linting checks       |
| `npm run clean`    | Clean build artifacts    |

## Future Roadmap

### Phase 1: Core Enhancements (Q2 2025)
- [ ] **Rewards System**: Implement automatic reward distribution for staked points
- [ ] **Time-Locked Staking**: Add lock periods with multiplier bonuses
- [ ] **Admin Functions**: Owner-controlled parameters (claim amounts, rewards rates)
- [ ] **Emergency Pause**: Circuit breaker for security incidents
- [ ] **Batch Operations**: Allow multiple claims/stakes/withdrawals in one transaction

### Phase 2: Advanced Features (Q3 2025)
- [ ] **Delegation**: Allow users to delegate voting power while keeping points private
- [ ] **NFT Integration**: Tie encrypted points to NFT ownership for tiered access
- [ ] **Multi-Token Support**: Extend to support multiple point types or currencies
- [ ] **Cross-Chain Bridge**: Enable encrypted point transfers across chains
- [ ] **Encrypted Leaderboard**: Competitive rankings without exposing individual balances

### Phase 3: DeFi Integration (Q4 2025)
- [ ] **Lending Protocol**: Borrow against encrypted staked balances
- [ ] **Liquidity Pools**: Private AMM pools with encrypted reserves
- [ ] **Yield Aggregator**: Automatically optimize staking strategies
- [ ] **Insurance**: Protect staked assets with encrypted coverage amounts
- [ ] **DAO Governance**: Private voting based on staked points

### Phase 4: Enterprise & Scaling (Q1 2026)
- [ ] **Selective Disclosure**: Prove balance ranges without revealing exact amounts
- [ ] **Auditor Roles**: Grant time-limited read access to authorized auditors
- [ ] **Compliance Module**: Built-in KYC/AML hooks with privacy preservation
- [ ] **L2 Deployment**: Deploy on Layer 2 solutions for lower fees
- [ ] **Gas Optimization**: Further optimize FHE operations for cost efficiency

### Phase 5: Ecosystem Expansion (Q2 2026)
- [ ] **SDK Development**: JavaScript/Python SDKs for easy integration
- [ ] **Mobile Wallet**: Native mobile app with FHE support
- [ ] **Developer Tools**: Block explorer, debugger, and visualization tools
- [ ] **Plugin System**: Allow third-party extensions and integrations
- [ ] **Grant Program**: Fund projects building on SilentStake

### Research & Innovation (Ongoing)
- [ ] **FHE Optimization**: Research faster FHE operations and reduced gas costs
- [ ] **New Encrypted Types**: Support for encrypted floats, timestamps, and strings
- [ ] **Privacy-Preserving Analytics**: Generate aggregate statistics without individual exposure
- [ ] **Interoperability**: Standards for cross-protocol encrypted value transfers
- [ ] **Formal Verification**: Mathematical proofs of security properties

### Security & Audits
- [ ] **Smart Contract Audit**: Third-party security audit by reputable firm
- [ ] **Bug Bounty Program**: Incentivize security researchers to find vulnerabilities
- [ ] **Formal Verification**: Mathematically prove contract correctness
- [ ] **Testnet Stress Testing**: Large-scale testing before mainnet deployment
- [ ] **Incident Response Plan**: Documented procedures for security events

## Use Cases

### Financial Applications
- **Private Wealth Management**: High-net-worth individuals can manage portfolios without exposing positions
- **Salary & Payroll**: Companies can process payments with encrypted amounts
- **Credit Scoring**: Verify creditworthiness without revealing financial history
- **Insurance Claims**: Process claims while keeping payout amounts confidential

### Gaming & Entertainment
- **Gaming Economies**: In-game currencies with private balances to prevent exploitation
- **Competitive Esports**: Hide tournament prize pools and player earnings
- **Betting Platforms**: Private wagers and winnings to comply with regulations
- **Loyalty Programs**: Reward points systems with enhanced privacy

### Enterprise & B2B
- **Supply Chain**: Track inventory values without exposing pricing to competitors
- **Procurement**: Sealed-bid auctions with encrypted bid amounts
- **Employee Benefits**: Manage equity, bonuses, and benefits privately
- **Partnership Agreements**: Revenue sharing with confidential payment terms

### Governance & DAOs
- **Private Voting**: Vote weight based on encrypted stake without revealing holdings
- **Treasury Management**: DAO finances with selective transparency
- **Proposal Funding**: Anonymous grant proposals and allocations
- **Reputation Systems**: Merit-based access without exposing contribution amounts

## Security Considerations

### Smart Contract Security
- **Reentrancy Protection**: Uses Checks-Effects-Interactions pattern
- **Integer Overflow**: Solidity 0.8.27 has built-in overflow protection
- **Access Control**: Only users can decrypt their own balances
- **State Consistency**: Atomic updates prevent race conditions

### FHE-Specific Security
- **Ciphertext Integrity**: Cryptographic proofs validate encrypted inputs
- **Key Management**: FHEVM handles key generation and distribution
- **Side-Channel Resistance**: FHE operations are resistant to timing attacks
- **Proof Verification**: All encrypted inputs require valid proofs

### Operational Security
- **Private Key Management**: Users must secure their wallet private keys
- **Network Security**: Deploy on reputable networks with active validators
- **Monitoring**: Set up alerts for unusual contract activity
- **Upgradability**: Consider proxy patterns for future improvements

### Known Limitations
- **Gas Costs**: FHE operations are more expensive than plaintext operations
- **Computation Time**: Encrypted operations take longer to execute
- **Network Requirements**: Requires FHEVM-compatible blockchain infrastructure
- **Decryption Keys**: Users must manage keys to decrypt their data

## Performance & Gas Costs

### Typical Gas Usage (Sepolia Testnet)
| Operation | Estimated Gas | Cost @ 20 gwei |
|-----------|---------------|----------------|
| `claim()` | ~500,000 | ~0.01 ETH |
| `stake()` | ~800,000 | ~0.016 ETH |
| `withdraw()` | ~800,000 | ~0.016 ETH |
| `balanceOf()` | ~50,000 | ~0.001 ETH |

*Note: Gas costs for FHE operations are significantly higher than standard EVM operations due to cryptographic computation overhead.*

### Optimization Strategies
1. **Batch Operations**: Combine multiple operations to amortize fixed costs
2. **Efficient Storage**: Use packed storage for non-encrypted state
3. **Lazy Initialization**: Only initialize encrypted values when needed
4. **Gas Tokens**: Consider GST2 or CHI for gas optimization
5. **L2 Deployment**: Deploy on Layer 2 for 10-100x gas savings

## Contributing

We welcome contributions from the community! Here's how you can help:

### Development
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines
- Follow existing code style and conventions
- Write tests for new features
- Update documentation for API changes
- Keep commits atomic and well-described
- Ensure all tests pass before submitting PR

### Areas for Contribution
- Bug fixes and security improvements
- Gas optimization techniques
- Additional test coverage
- Documentation improvements
- Example applications and integrations
- UI/UX for frontend applications

## FAQ

**Q: How is this different from Aztec or Tornado Cash?**
A: SilentStake uses FHE for computation on encrypted data, while Aztec uses zero-knowledge proofs and Tornado Cash uses mixers. FHE enables more complex operations and better composability.

**Q: Can anyone see my balance?**
A: No. Only you can decrypt your balance using your private key. The blockchain only stores encrypted values.

**Q: What happens if I lose my private key?**
A: You lose access to decrypt your balances. The encrypted data remains on-chain but cannot be decrypted. Consider using backup solutions.

**Q: Why are gas costs so high?**
A: FHE operations involve complex cryptographic computations that require more gas than standard operations. Costs will decrease as technology improves.

**Q: Is this production-ready?**
A: SilentStake is currently in testnet phase. A security audit is required before mainnet deployment. Use at your own risk.

**Q: Which networks are supported?**
A: Currently supports Sepolia testnet and local Hardhat. Mainnet support pending FHEVM mainnet launch and security audits.

**Q: Can I integrate this into my existing project?**
A: Yes! SilentStake is designed to be composable. You can integrate encrypted balances into existing DeFi protocols.

**Q: How do I report a security issue?**
A: Please report security vulnerabilities privately to the maintainers. Do not open public issues for security concerns.

## Resources & Documentation

### FHEVM Documentation
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

### Learning Resources
- [Introduction to Fully Homomorphic Encryption](https://www.zama.ai/post/what-is-fully-homomorphic-encryption-fhe)
- [Building Confidential Smart Contracts](https://www.zama.ai/post/confidential-smart-contracts-using-fhevm)
- [FHEVM Workshop Materials](https://github.com/zama-ai/fhevm-workshop)
- [Hardhat Documentation](https://hardhat.org/docs)

### Community
- **GitHub**: [SilentStake Repository](https://github.com/yourusername/SilentStake)
- **Zama Discord**: [Join the Community](https://discord.gg/zama)
- **Twitter**: Follow [@Zama_fhe](https://twitter.com/zama_fhe) for updates
- **Forum**: [Zama Community Forum](https://community.zama.ai)

## License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

### Third-Party Licenses
- FHEVM by Zama: BSD-3-Clause-Clear
- OpenZeppelin Contracts: MIT License
- Hardhat: MIT License
- Ethers.js: MIT License

## Acknowledgments

- **Zama Team**: For developing and maintaining the FHEVM protocol
- **Ethereum Foundation**: For supporting privacy research and development
- **Hardhat Team**: For the excellent development framework
- **Community Contributors**: For feedback, testing, and contributions

## Support & Contact

### Get Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/SilentStake/issues)
- **FHEVM Documentation**: [Technical documentation](https://docs.zama.ai)
- **Zama Discord**: [Community support](https://discord.gg/zama)

### Commercial Inquiries
For enterprise solutions, custom integrations, or consulting services, please contact the maintainers through GitHub.

---

**Built with privacy in mind using FHEVM by Zama**

*Disclaimer: This project is experimental and not audited. Use at your own risk. Never invest more than you can afford to lose.*
