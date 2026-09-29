# ConsentChain — Project Report

## 1. Project identity

**Module:** EC8204 Blockchain and Cyber Security  
**Team:** EG/2021/4877 — Wijesinghe S.A; EG/2021/4651 — Madakaladeniya I.U; EG/2021/4667 — Malsha H.C; EG/2021/4597 — Karunanayake W.H.P.T.H  
**Domain:** Healthcare Research / Consent Management  
**Application:** Patient-controlled authorization for research-data access

## 2. Problem

Medical-research consent is usually held by one institution in a mutable database or paper trail. When studies involve more than one organization, researchers and auditors may not share a single trustworthy view of what a patient authorized, when the authorization expires, or whether it was revoked. Patients also need a simple way to withdraw authorization without relying on a database operator to update every downstream copy.

## 3. Proposed solution

ConsentChain records the lifecycle of a research-data consent on Ethereum. An administrator approves legitimate researcher wallets. A patient grants a particular researcher access for a stated data category, a hashed purpose and an expiry time. The patient's wallet signature proves authorization. The patient can later revoke the grant; anyone can verify its live status and audit emitted events.

The chain stores no medical records, names or direct patient identifiers. Actual data remains in authorized off-chain systems. Blockchain acts as a shared authorization and audit layer, not as a medical database.

## 4. Architecture

```text
Patient wallet ──grant/revoke──► ConsentRegistry smart contract
                                      │
Institution admin ──approve researcher┤── immutable events / timestamps
                                      │
Researcher or auditor ──verify────────┘

Clinical/research data remains in encrypted institutional storage.
Only hashes and consent metadata are anchored on Ethereum.
```

## 5. Smart-contract model

`Researcher` contains an organization label and active flag. `Consent` contains its ID, patient and researcher addresses, hashed subject reference, hashed purpose, data category, issue/expiry time and optional revocation time.

Key functions:

- `setResearcher`: administrator approves or deactivates a researcher.
- `grantConsent`: patient creates a consent for an active researcher.
- `revokeConsent`: granting patient marks consent revoked.
- `isConsentValid`: evaluates existence, revocation, expiry and researcher status.
- `getConsent` and address indexes: support verification and the dApp dashboard.

## 6. Threat model and controls

| Threat | Control in prototype | Remaining concern |
|---|---|---|
| Fake researcher | Administrator allow-list | Administrator identity and governance |
| Researcher changes consent | No mutation function for researchers | Off-chain enforcement must check chain |
| Another wallet revokes consent | `msg.sender` must equal patient | Lost patient key requires recovery design |
| Use after expiry/revocation | Live `isConsentValid` calculation | Data systems must enforce the result |
| Patient privacy leakage | Hashed references; no medical data | Low-entropy references require salts |
| Administrator compromise | Restricted modifier and visible events | Production needs multisignature governance |
| Reentrancy | No external calls | Future upgrades require renewed analysis |

## 7. Testing

The automated suite checks administrator-only researcher approval, valid consent creation, rejection of unapproved researchers, patient-only revocation, expiry and researcher deactivation. The frontend production build is also validated.

## 8. Distinctness from registered projects

The topic registry was reviewed on 29 September 2026. Existing selections cover voting, supply chains, certificates, escrow, donations, tickets, vehicle/land history, copyright, AI provenance, evidence custody, threat intelligence, key recovery and licensing. ConsentChain addresses a different workflow: patient-controlled research authorization and revocation. It does not issue certificates, track physical goods, escrow funds, manage ownership or store evidence files.

## 9. Ethical and legal considerations

Blockchain immutability conflicts with storing personal data that may need correction or deletion. The prototype therefore stores hashes and minimal metadata only. Hashing alone does not automatically anonymize data, particularly when inputs have a small guessable domain. A real deployment must use salted or zero-knowledge identifiers, data-protection impact assessment, clear controller/processor responsibilities, emergency access policy and jurisdiction-specific legal review. On-chain consent is evidence of authorization; it does not replace informed-consent communication or ethics-board requirements.

## 10. Future work

- Multisignature institutional administration and decentralized researcher credentials
- Signed consent-document commitments and versioning
- Selective disclosure or zero-knowledge purpose proofs
- Secure patient key recovery and delegated carers
- Integration with FHIR authorization servers and encrypted storage
- Event indexer, notifications and testnet deployment
- Formal verification and independent audit

## 11. Conclusion

ConsentChain demonstrates where blockchain adds value without treating it as general storage. Ethereum supplies a shared, tamper-evident consent state across parties; wallet signatures give patients direct control; and explicit expiry/revocation prevents stale permissions from appearing valid. The design keeps sensitive data off-chain and exposes its remaining privacy and governance limitations.
