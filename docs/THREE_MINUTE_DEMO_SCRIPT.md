# Three-minute presentation and demo script

## 0:00–0:30 — Problem

“Research consent is often fragmented across paper forms and institutional databases. When several organizations collaborate, it can be difficult to prove exactly what a patient authorized, whether permission expired, or whether it was revoked. ConsentChain creates a shared, tamper-evident consent state without putting medical data on a public blockchain.”

## 0:30–1:00 — Design

“The administrator first approves legitimate researcher wallets. A patient then grants one approved researcher access for a named data category, research-purpose hash and expiry time. The patient reference and purpose are hashed in the browser. Only minimal metadata, timestamps and wallet addresses go on-chain; clinical data stays in encrypted institutional storage.”

## 1:00–2:15 — Live demo

1. Show the connected patient wallet and local Hardhat network.
2. Point out the pre-approved researcher address.
3. Enter patient reference `clinic-1042`, purpose `cardio-study-v1`, category `Blood pressure observations`, and 30 days.
4. Click **Sign & grant consent** and confirm in MetaMask.
5. Open the new record and verify its consent ID. Show **VALID CONSENT**.
6. Enter the same ID under revoke, confirm the patient transaction, then verify again.
7. Show **NOT CURRENTLY VALID** and explain that the history remains immutable.

## 2:15–2:45 — Security proof

“The contract rejects unapproved researchers, expired timestamps, and revocation by any wallet except the patient. Validity also becomes false if the administrator deactivates the researcher. Six automated tests cover these controls. The contract makes no external calls, reducing reentrancy exposure.”

## 2:45–3:00 — Closing

“ConsentChain uses blockchain only for the shared trust problem: authorization and audit. It keeps sensitive records off-chain, gives patients direct revocation control, and gives researchers a verifiable answer before data use.”
