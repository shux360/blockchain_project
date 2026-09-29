import { BrowserProvider, Contract, id } from "ethers";
import deployment from "./deployment.json";
import "./style.css";

const short = (value = "") => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "Not connected";
const when = (seconds) => new Date(Number(seconds) * 1000).toLocaleString();
let provider;
let signer;
let contract;
let account = "";

document.querySelector("#app").innerHTML = `
  <header class="nav">
    <a class="brand" href="#"><span class="mark">C</span>ConsentChain</a>
    <button id="connect" class="button button-primary">Connect wallet</button>
  </header>
  <main>
    <section class="hero">
      <div>
        <p class="eyebrow">PATIENT-CONTROLLED • AUDITABLE • PRIVATE BY DESIGN</p>
        <h1>Consent that can be proven — and withdrawn.</h1>
        <p class="lead">Grant researchers purpose-bound, time-limited access permission without placing personal or medical data on-chain.</p>
        <div class="hero-actions"><a href="#grant" class="button button-primary">Grant consent</a><a href="#verify" class="button button-ghost">Verify a record</a></div>
      </div>
      <div class="proof">
        <div class="proof-row"><span>01</span><div><strong>Patient signs</strong><small>Wallet proves who authorized the consent.</small></div></div>
        <div class="proof-row"><span>02</span><div><strong>Contract enforces</strong><small>Researcher status, expiry and revocation are checked.</small></div></div>
        <div class="proof-row"><span>03</span><div><strong>Auditor verifies</strong><small>Immutable events preserve a transparent trail.</small></div></div>
      </div>
    </section>

    <section class="status-strip">
      <div><span>NETWORK</span><strong id="network">Localhost 31337</strong></div>
      <div><span>CONNECTED ACCOUNT</span><strong id="account">Not connected</strong></div>
      <div><span>CONTRACT</span><strong>${short(deployment.address) || "Deploy first"}</strong></div>
    </section>

    <section class="workspace" id="grant">
      <div class="section-heading"><p class="eyebrow">PATIENT WORKSPACE</p><h2>Create a precise permission record.</h2></div>
      <form id="grant-form" class="panel form-grid">
        <label>Approved researcher address<input id="researcher" value="${deployment.demoResearcher}" placeholder="0x…" required /></label>
        <label>Local patient reference<input id="subject" placeholder="e.g. clinic-ID-1042" required /></label>
        <label>Research purpose<input id="purpose" placeholder="e.g. cardiovascular-study-v1" required /></label>
        <label>Data category<input id="category" placeholder="e.g. blood-pressure observations" required /></label>
        <label>Consent duration<select id="duration"><option value="1">1 day</option><option value="30" selected>30 days</option><option value="90">90 days</option><option value="365">1 year</option></select></label>
        <div class="privacy-note"><strong>Nothing sensitive is published.</strong><span>The patient reference and research purpose are hashed in your browser before the transaction.</span></div>
        <button class="button button-primary form-submit" type="submit">Sign & grant consent</button>
      </form>
    </section>

    <section class="split" id="verify">
      <div>
        <div class="section-heading"><p class="eyebrow">VERIFY</p><h2>Check current consent status.</h2></div>
        <form id="verify-form" class="panel compact-form"><label>Consent ID<input id="verify-id" type="number" min="1" placeholder="1" required /></label><button class="button button-dark">Verify</button></form>
        <div id="verification" class="result empty">Enter a consent ID to query the blockchain.</div>
      </div>
      <div>
        <div class="section-heading"><p class="eyebrow">PATIENT CONTROL</p><h2>Revoke without asking permission.</h2></div>
        <form id="revoke-form" class="panel compact-form"><label>Consent ID<input id="revoke-id" type="number" min="1" placeholder="1" required /></label><button class="button button-danger">Revoke consent</button></form>
        <p class="aside">Only the wallet that granted a consent can revoke it. The history remains visible, but validity changes immediately.</p>
      </div>
    </section>
    <section class="activity"><div class="section-heading"><p class="eyebrow">MY CONSENTS</p><h2>Your on-chain permissions.</h2></div><div id="records" class="records"><p class="empty">Connect a wallet to load records.</p></div></section>
  </main>
  <div id="toast" role="status"></div>
  <footer><span>ConsentChain • EC8204 Blockchain and Cyber Security</span><span>No personal or research data is stored on-chain.</span></footer>
`;

function toast(message, kind = "ok") {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.className = `show ${kind}`;
  setTimeout(() => { el.className = ""; }, 4200);
}

async function connect() {
  if (!window.ethereum) return toast("Install MetaMask to use the dApp.", "error");
  if (!deployment.address || deployment.abi.length === 0) return toast("Deploy the contract locally first. See README.md.", "error");
  provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  account = await signer.getAddress();
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== deployment.chainId) return toast(`Switch MetaMask to chain ${deployment.chainId}.`, "error");
  contract = new Contract(deployment.address, deployment.abi, signer);
  document.querySelector("#account").textContent = short(account);
  document.querySelector("#network").textContent = `Hardhat ${network.chainId}`;
  document.querySelector("#connect").textContent = short(account);
  await loadRecords();
}

async function consentView(consentId) {
  const consent = await contract.getConsent(consentId);
  const valid = await contract.isConsentValid(consentId);
  return { consent, valid };
}

function recordMarkup(consent, valid) {
  const status = valid ? "Active" : Number(consent.revokedAt) > 0 ? "Revoked" : "Expired / inactive";
  return `<article class="record"><div><span class="pill ${valid ? "active" : "inactive"}">${status}</span><h3>Consent #${consent.id}</h3><p>${consent.dataCategory}</p></div><dl><div><dt>Researcher</dt><dd>${short(consent.researcher)}</dd></div><div><dt>Issued</dt><dd>${when(consent.issuedAt)}</dd></div><div><dt>Expires</dt><dd>${when(consent.expiresAt)}</dd></div></dl></article>`;
}

async function loadRecords() {
  const ids = await contract.getPatientConsentIds(account);
  const records = await Promise.all([...ids].reverse().map(consentView));
  document.querySelector("#records").innerHTML = records.length ? records.map(({ consent, valid }) => recordMarkup(consent, valid)).join("") : '<p class="empty">No consent records from this wallet yet.</p>';
}

document.querySelector("#connect").addEventListener("click", () => connect().catch((e) => toast(e.shortMessage || e.message, "error")));

document.querySelector("#grant-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    if (!contract) await connect();
    const days = Number(document.querySelector("#duration").value);
    const expiresAt = Math.floor(Date.now() / 1000) + days * 86400;
    const tx = await contract.grantConsent(
      document.querySelector("#researcher").value.trim(),
      id(document.querySelector("#subject").value.trim()),
      id(document.querySelector("#purpose").value.trim()),
      document.querySelector("#category").value.trim(),
      expiresAt
    );
    toast("Transaction submitted. Waiting for confirmation…");
    await tx.wait();
    toast("Consent granted and recorded on-chain.");
    await loadRecords();
  } catch (e) { toast(e.shortMessage || e.reason || e.message, "error"); }
});

document.querySelector("#verify-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    if (!contract) await connect();
    const { consent, valid } = await consentView(document.querySelector("#verify-id").value);
    document.querySelector("#verification").className = `result ${valid ? "valid" : "invalid"}`;
    document.querySelector("#verification").innerHTML = `<strong>${valid ? "VALID CONSENT" : "NOT CURRENTLY VALID"}</strong><span>Patient ${short(consent.patient)} → Researcher ${short(consent.researcher)}</span><span>${consent.dataCategory} • expires ${when(consent.expiresAt)}</span>`;
  } catch (e) { toast(e.shortMessage || e.reason || e.message, "error"); }
});

document.querySelector("#revoke-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    if (!contract) await connect();
    const tx = await contract.revokeConsent(document.querySelector("#revoke-id").value);
    await tx.wait();
    toast("Consent revoked. The audit record remains immutable.");
    await loadRecords();
  } catch (e) { toast(e.shortMessage || e.reason || e.message, "error"); }
});

window.ethereum?.on?.("accountsChanged", () => window.location.reload());
window.ethereum?.on?.("chainChanged", () => window.location.reload());
