# ConsentChain

ConsentChain is an Ethereum dApp for **revocable, purpose-bound and time-limited research-data consent**. A patient signs a consent grant with their wallet; an approved researcher or auditor can verify whether that grant is currently valid. Only hashes and non-sensitive consent metadata are stored on-chain—medical records and personally identifiable information remain off-chain.

## Team

- EG/2021/4877 — Wijesinghe S.A
- EG/2021/4651 — Madakaladeniya I.U
- EG/2021/4667 — Malsha H.C
- EG/2021/4597 — Karunanayake W.H.P.T.H

## Why blockchain?

Research consent is often fragmented across institutional databases. A record may be difficult to audit across organizations, and a patient may have no independently verifiable proof that consent was revoked. ConsentChain uses Ethereum for the narrow part that benefits from a shared ledger: authorization, timestamps, expiry, revocation, researcher status and an immutable event trail. It deliberately does **not** put patient or research data on-chain.

## Features

- Administrator allow-lists legitimate research organizations.
- Patients grant consent to an approved researcher for a category and expiry time.
- Local patient references and research-purpose descriptions are hashed in the browser.
- Patients can revoke their own consent immediately.
- Researchers and auditors can verify current validity.
- Consent becomes invalid after expiry or researcher deactivation.
- Solidity events preserve a transparent audit trail.
- Responsive web interface supports MetaMask and a local Hardhat chain.

## Technology

- Solidity 0.8.24 smart contract
- Hardhat local Ethereum network and test runner
- ethers.js 6 wallet/contract integration
- Vite + semantic HTML/CSS/JavaScript frontend

## Quick start

Prerequisites: Node.js 18+ and MetaMask.

```bash
npm install
npm run compile
npm test
```

Run the local chain in terminal 1:

```bash
npm run node
```

Deploy in terminal 2:

```bash
npm run deploy:local
```

The deploy script writes the contract address, ABI, administrator and demo researcher into `src/deployment.json`.

Start the frontend in terminal 3:

```bash
npm run dev
```

Open the printed local URL. Add the Hardhat network to MetaMask:

- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

Import one of the private keys printed by `npm run node`. Account 0 is the administrator, account 1 is the pre-approved demo researcher, and any other account can act as a patient. Never use these development keys on a public network.

## Demo flow

1. Connect a patient account in MetaMask.
2. Use the prefilled demo researcher address.
3. Enter a local patient reference, purpose, data category and duration.
4. Sign the grant transaction and note the consent ID.
5. Verify that ID: it is active.
6. Revoke it from the patient account.
7. Verify again: it is no longer valid, while its history remains.

## Security and privacy decisions

- No names, diagnoses, files or clinical records are stored on-chain.
- `subjectReference` and `purposeHash` are `bytes32` hashes; production deployments should salt low-entropy identifiers before hashing.
- Only the deployer can approve/deactivate researchers.
- Only the granting patient can revoke a consent.
- Solidity custom errors make authorization and input failures explicit.
- Validity checks combine revocation, expiry and researcher status.
- The contract follows checks-before-effects and makes no external calls, limiting reentrancy exposure.

## Production limitations

This is an academic prototype, not a clinical system. A production deployment would require independent smart-contract audit, multisignature/DAO administration, institution identity verification, key recovery, encrypted off-chain storage, jurisdiction-specific privacy review, salted/zero-knowledge identifiers, indexer infrastructure, accessibility testing and a supported testnet/mainnet deployment.

## Project structure

```text
contracts/ConsentRegistry.sol   Smart contract
scripts/deploy.js               Deployment and frontend configuration
test/ConsentRegistry.test.js    Automated contract tests
src/main.js                     dApp behavior and ethers integration
src/style.css                   Responsive interface
docs/                           Report, registration text and demo script
```
