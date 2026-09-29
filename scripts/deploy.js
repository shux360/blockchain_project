const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

async function main() {
  const [administrator, researcher] = await hre.ethers.getSigners();
  const Registry = await hre.ethers.getContractFactory("ConsentRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  await (await registry.setResearcher(researcher.address, "Ruhuna Health Research Unit", true)).wait();

  const address = await registry.getAddress();
  const artifact = await hre.artifacts.readArtifact("ConsentRegistry");
  const deployment = {
    address,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    administrator: administrator.address,
    demoResearcher: researcher.address,
    abi: artifact.abi
  };
  const output = path.join(__dirname, "..", "src", "deployment.json");
  fs.writeFileSync(output, JSON.stringify(deployment, null, 2));
  console.log(`ConsentRegistry deployed to ${address}`);
  console.log(`Demo researcher: ${researcher.address}`);
  console.log(`Frontend configuration written to ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
