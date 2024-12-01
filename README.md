# Communitas Cross-Chain NFT

This repository implements a cross-chain NFT solution using the Arbitrum Orbit SDK. The system enables seamless bridging of NFTs between Layer 1 (L1) and Layer 2 (L2) networks while leveraging Arbitrum's scalability and efficiency.

---

## Features

- **Cross-Chain NFT Bridging**: Transfer NFTs between Ethereum (L1) and Arbitrum (L2).
- **Gas-Efficient Transactions**: Utilizes Arbitrum's Nitro for reduced transaction costs.
- **Retryable Tickets**: Ensures message reliability between chains.
- **Custom Minting Logic**: Allows minting only through authorized cross-chain operations.

---

## Technology Stack

- **Solidity**: Smart contract development.
- **Hardhat**: Development environment for deployment.
- **Arbitrum SDK**: For cross-chain functionality.
- **Ethers.js**: Interfacing with Ethereum nodes.
- **Pinata**: For hosting NFT metadata on IPFS.

---

## Prerequisites

1. **Node.js**: Install Node.js (>= v16.0.0).
2. **Yarn**: Install Yarn for package management.
3. **Arbitrum SDK**: Includes libraries for bridging and gas estimations.
4. **Dotenv**: Store environment variables securely.

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/communitas-nft.git
   cd communitas-nft

## Installation

2. Install dependencies:
   ```bash
   yarn install

3. Set up environment variables in a `.env` file:
   ```plaintext
   PRIVATE_KEY=<your_private_key>
   L1RPC=https://mainnet.infura.io/v3/<your_infura_project_id>
   L2RPC=https://arb1.arbitrum.io/rpc

## Deployment

1. Compile the contracts:
   ```bash
   yarn build

Deploy the L1 and L2 contracts and set the counterpart addresses. Use the scripts for bridging functionality:
- For L1 to L2:
  ```bash
  yarn l1tol2

- For L2 to L1:
  ```bash
  yarn l2tol1

## Directory Structure

- `contracts/`
    - `l1` — `CommunitasNFTL1.sol`: L1 contract
    - `l2` — `CommunitasNFTL2.sol`: L2 contract
    - `CommunitasNFT.sol`: Base NFT contract
- `scripts/`
    - `bridgeL1ToL2.test.js`: Test script for L1 to L2 bridging
    - `bridgeL2ToL1.test.js`: Test script for L2 to L1 bridging
- `utils/`
    - `checkParentOutboxExecutionBlock.js`
    - `mapOrbitConfigToOrbitChain.ts`
- `.env`: Environment variables
- `README.md`: Documentation


---

## Package Scripts

The `package.json` defines the following scripts for ease of use:

- **`yarn build`**: Compiles the smart contracts.
- **`yarn l1tol2`**: Runs the script to bridge NFTs from L1 to L2.
- **`yarn l2tol1`**: Runs the script to bridge NFTs from L2 to L1.

## Support

For questions or issues, please open an issue on [GitHub](https://github.com/dindonero/communitas-nft/issues).
