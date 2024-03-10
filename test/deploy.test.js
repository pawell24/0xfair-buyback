const { expect } = require("chai");
const { ethers } = require("hardhat");
const factoryArtifact = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const routerArtifact = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const pairArtifact = require("@uniswap/v2-periphery/build/IUniswapV2Pair.json");
const { Contract, ContractFactory } = require("ethers");

async function deployUniswapContracts(owner) {
  // Deploy a WETH contract
  const WETH = await ethers.getContractFactory("WETH9");
  const weth = await WETH.deploy();

  const Factory = new ethers.ContractFactory(
    factoryArtifact.abi,
    factoryArtifact.bytecode,
    owner
  );
  const factory = await Factory.deploy(owner.address);

  const Router = new ethers.ContractFactory(
    routerArtifact.abi,
    routerArtifact.bytecode,
    owner
  );
  const router = await Router.deploy(factory.target, weth.target);

  return [factory, router, weth];
}

describe("TokenTaxDistribution", function () {
  let TokenTaxDistribution;
  let tokenTaxDistribution;
  let FairToken;
  let fairToken;
  let FairStaking;
  let fairStaking;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let router;
  let weth;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    console.log({ owner });

    FairToken = await ethers.getContractFactory("FairToken");
    fairToken = await FairToken.deploy(1000000);

    FairStaking = await ethers.getContractFactory("FairStaking");
    fairStaking = await FairStaking.deploy(fairToken);

    [factory, router, weth] = await deployUniswapContracts(owner);

    TokenTaxDistribution = await ethers.getContractFactory(
      "TokenTaxDistribution"
    );

    tokenTaxDistribution = await TokenTaxDistribution.deploy(
      addr1,
      router,
      fairToken,
      fairStaking
    );

    const tx1 = await factory.createPair(fairToken, weth);
    await tx1.wait();

    const MaxUint256 =
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    const pairAddress = await factory.getPair(fairToken, weth);
    console.log(`Pair deployed to ${pairAddress}`);

    const pair = new Contract(pairAddress, pairArtifact.abi, owner);

    const approveTx1 = await weth.approve(router, MaxUint256);
    await approveTx1.wait();
    const approvalTx2 = await fairToken.approve(router, MaxUint256);
    await approvalTx2.wait();

    const token0Amount = ethers.parseUnits("0.0001");
    const ethAmount = ethers.parseUnits("1");
    console.log({ fairToken });
    const addLiquidityTx = await router.addLiquidityETH(
      fairToken,
      10000,
      0,
      0,
      owner.address, // recipient of LP tokens
      Math.floor(Date.now() / 1000), // Current timestamp,
      { value: ethAmount }
    );

    await addLiquidityTx.wait();
    reserves = await pair.getReserves();
    console.log(
      `Reserves: ${reserves[0].toString()}, ${reserves[1].toString()}`
    );
  });

  describe("FairToken Deployment", function () {
    it("Should deploy FairToken with the correct initial supply", async function () {
      const initialSupply = 1000000000000000000000000n; // Use BigInt literal

      // Check the total supply of FairToken
      const totalSupply = await fairToken.totalSupply();
      expect(totalSupply).to.equal(initialSupply);

      // Check the balance of the deployer (owner)
      const ownerBalance = await fairToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(999999999999999999999000n);
    });
  });

  describe("Contract deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await tokenTaxDistribution.owner()).to.equal(owner.address);
    });

    it("Should set the correct recipient", async function () {
      expect(await tokenTaxDistribution.recipient()).to.equal(addr1.address);
    });

    it("Should set the correct Uniswap router address", async function () {
      expect(await tokenTaxDistribution.uniswapV2Router()).to.equal(router);
    });

    it("Should set the correct token address", async function () {
      expect(await tokenTaxDistribution.token()).to.equal(fairToken);
    });

    it("Should set the correct fair staking address", async function () {
      expect(await tokenTaxDistribution.fairStaking()).to.equal(fairStaking);
    });
  });

  describe("Contract functions", function () {
    it("Should set tax percentage", async function () {
      const newTaxPercentage = 30; // New tax percentage

      // Call setTaxPercentage function
      await tokenTaxDistribution.setTaxPercentage(newTaxPercentage);

      // Check if the tax percentage has been set correctly
      expect(await tokenTaxDistribution.taxPercentage()).to.equal(
        newTaxPercentage
      );
    });

    it("Should withdraw ETH to owner", async function () {
      // Define the amount to send to the contract
      const sendAmount = ethers.parseEther("1.0");

      // Send Ether to the contract from addr1
      await addr1.sendTransaction({
        to: tokenTaxDistribution.target,
        value: sendAmount,
      });

      // Retrieve the initial balance of the owner and the contract
      const initialOwnerBalance = await ethers.provider.getBalance(
        owner.address
      );

      const initialContractBalance = await ethers.provider.getBalance(
        tokenTaxDistribution.target
      );

      // Define the amount to withdraw from the contract
      const withdrawAmount = ethers.parseEther("0.1");

      // Execute the withdrawal function on the contract
      await tokenTaxDistribution.manuallyWithdrawETH(withdrawAmount);

      // Retrieve the final balance of the owner and the contract after withdrawal
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      const finalContractBalance = await ethers.provider.getBalance(
        tokenTaxDistribution.target
      );

      expect(finalContractBalance).to.equal(ethers.parseEther("0.2"));
    });
  });

  describe("Should buy back tokens", async function () {
    it("Should withdraw ETH to owner", function () {});
  });
});
