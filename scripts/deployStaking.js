const hre = require("hardhat");

async function main() {
  try {
    const lock = await hre.ethers.deployContract("FairStaking", [
      "0x2e0e5b6dd215AB98E8C63ed68fa75F7C61ba8e86",
    ]);
    await lock.waitForDeployment();
    console.log(`Contract Deployed to address ${await lock.getAddress()}`);
  } catch (e) {
    console.log(e);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Staking: 0xb8628Bfe4Dd53dd23fE076E6183c3bfB67e7A1DD
// npx hardhat verify --network sepiola 0xb8628Bfe4Dd53dd23fE076E6183c3bfB67e7A1DD 0x2e0e5b6dd215AB98E8C63ed68fa75F7C61ba8e86
// TaxSplitter: 0xEC793d1CBD1b77F29A806DA762fe3eF3F8380980
// npx hardhat verify --network sepiola 0xEC793d1CBD1b77F29A806DA762fe3eF3F8380980 0x8216A525944FE19e0DB5e4CE64726ac8b0E77313 0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008 0x2e0e5b6dd215AB98E8C63ed68fa75F7C61ba8e86
