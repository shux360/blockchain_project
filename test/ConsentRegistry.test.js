const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ConsentRegistry", function () {
  async function fixture() {
    const [admin, patient, researcher, outsider] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("ConsentRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    await registry.setResearcher(researcher.address, "University Research Lab", true);
    return { registry, admin, patient, researcher, outsider };
  }

  it("allows only the administrator to approve researchers", async function () {
    const { registry, outsider } = await fixture();
    await expect(registry.connect(outsider).setResearcher(outsider.address, "Fake Lab", true))
      .to.be.revertedWithCustomError(registry, "OnlyAdministrator");
  });

  it("grants valid, auditable consent to an approved researcher", async function () {
    const { registry, patient, researcher } = await fixture();
    const latest = await ethers.provider.getBlock("latest");
    const expiry = latest.timestamp + 3600;
    const subjectRef = ethers.id("patient-local-id-1042");
    const purposeHash = ethers.id("cardiovascular-study-v1");

    await expect(registry.connect(patient).grantConsent(
      researcher.address, subjectRef, purposeHash, "Blood pressure observations", expiry
    )).to.emit(registry, "ConsentGranted");

    const consent = await registry.getConsent(1);
    expect(consent.patient).to.equal(patient.address);
    expect(consent.researcher).to.equal(researcher.address);
    expect(consent.subjectReference).to.equal(subjectRef);
    expect(await registry.isConsentValid(1)).to.equal(true);
  });

  it("rejects consent for an unapproved researcher", async function () {
    const { registry, patient, outsider } = await fixture();
    const latest = await ethers.provider.getBlock("latest");
    await expect(registry.connect(patient).grantConsent(
      outsider.address, ethers.id("subject"), ethers.id("purpose"), "Lab results", latest.timestamp + 3600
    )).to.be.revertedWithCustomError(registry, "ResearcherNotActive");
  });

  it("lets only the patient revoke and invalidates immediately", async function () {
    const { registry, patient, researcher, outsider } = await fixture();
    const latest = await ethers.provider.getBlock("latest");
    await registry.connect(patient).grantConsent(
      researcher.address, ethers.id("subject"), ethers.id("purpose"), "Imaging", latest.timestamp + 3600
    );
    await expect(registry.connect(outsider).revokeConsent(1))
      .to.be.revertedWithCustomError(registry, "OnlyPatient");
    await registry.connect(patient).revokeConsent(1);
    expect(await registry.isConsentValid(1)).to.equal(false);
  });

  it("invalidates expired consent", async function () {
    const { registry, patient, researcher } = await fixture();
    const latest = await ethers.provider.getBlock("latest");
    await registry.connect(patient).grantConsent(
      researcher.address, ethers.id("subject"), ethers.id("purpose"), "Survey", latest.timestamp + 10
    );
    await ethers.provider.send("evm_increaseTime", [11]);
    await ethers.provider.send("evm_mine");
    expect(await registry.isConsentValid(1)).to.equal(false);
  });

  it("invalidates consent when the administrator deactivates a researcher", async function () {
    const { registry, patient, researcher } = await fixture();
    const latest = await ethers.provider.getBlock("latest");
    await registry.connect(patient).grantConsent(
      researcher.address, ethers.id("subject"), ethers.id("purpose"), "Genomic summary", latest.timestamp + 3600
    );
    await registry.setResearcher(researcher.address, "University Research Lab", false);
    expect(await registry.isConsentValid(1)).to.equal(false);
  });
});
