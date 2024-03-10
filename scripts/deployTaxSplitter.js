const hre = require("hardhat");

async function main() {
  try {
    const lock = await hre.ethers.deployContract("TokenTaxDistribution", [
      "0x8216A525944FE19e0DB5e4CE64726ac8b0E77313",
      "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
      "0x2e0e5b6dd215AB98E8C63ed68fa75F7C61ba8e86",
    ]);
    await lock.waitForDeployment();
    console.log(`Contract Deployed to address ${await lock.getAddress()}`);
  } catch (e) {
    console.log(e);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
