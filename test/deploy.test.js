const { expect } = require("chai");
const { ethers } = require("hardhat");
const factoryArtifact = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const routerArtifact = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const pairArtifact = require("@uniswap/v2-periphery/build/IUniswapV2Pair.json");
const { Contract } = require("ethers");

async function deployUniswapContracts(owner) {
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

    [factory, router, weth] = await deployUniswapContracts(owner);

    FairToken = await ethers.getContractFactory("Fair");
    fairToken = await FairToken.deploy(router);

    FairStaking = await ethers.getContractFactory("FairStaking");
    fairStaking = await FairStaking.deploy(fairToken);

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

    const pairAddress = await factory.getPair(fairToken, weth);

    const pair = new Contract(pairAddress, pairArtifact.abi, owner);

    const approveTx1 = await fairToken.approve(
      router,
      100000000000000000000000n
    );
    await approveTx1.wait();

    const deadline = Math.floor(Date.now() / 1000) + 900;

    const ethAmount = ethers.parseEther("1");

    const addLiquidityTx = await router.addLiquidityETH(
      fairToken,
      100000000000000000000000n,
      100000000000000000000000n,
      ethAmount,
      owner,
      deadline,
      { value: ethAmount }
    );

    await addLiquidityTx.wait();
    reserves = await pair.getReserves();
    // console.log(
    //   `Reserves: ${reserves[0].toString()}, ${reserves[1].toString()}`
    // );
  });

  describe("FairToken Deployment", function () {
    it("Should deploy FairToken with the correct initial supply", async function () {
      const totalSupply = await fairToken.totalSupply();
      expect(totalSupply).to.equal(888000000000000000000000000n);

      const ownerBalance = await fairToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(887900000000000000000000000n);
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
      const newTaxPercentage = 30;

      await tokenTaxDistribution.setTaxPercentage(newTaxPercentage);

      expect(await tokenTaxDistribution.taxPercentage()).to.equal(
        newTaxPercentage
      );
    });

    it("Should withdraw ETH to owner", async function () {
      const sendAmount = ethers.parseEther("1.0");

      await addr1.sendTransaction({
        to: tokenTaxDistribution.target,
        value: sendAmount,
      });

      const initialOwnerBalance = await ethers.provider.getBalance(
        owner.address
      );

      const withdrawAmount = ethers.parseEther("0.1");

      await tokenTaxDistribution.manuallyWithdrawETH(withdrawAmount);

      const finalContractBalance = await ethers.provider.getBalance(
        tokenTaxDistribution.target
      );

      expect(finalContractBalance).to.equal(ethers.parseEther("0.2"));
    });
  });

  describe("Buyback tokens", function () {
    it("Should send ETH to the contract and perform buyback of tokens", async function () {
      const ethAmount = ethers.parseEther("10");
      const [signer] = await ethers.getSigners();

      const tx = await signer.sendTransaction({
        to: tokenTaxDistribution,
        value: ethAmount,
      });
      await tx.wait();

      const provider = ethers.provider;

      const balance = await provider.getBalance(tokenTaxDistribution);

      expect(balance).to.equal(ethers.parseEther(String(10 * 0.3)));

      const stakingBalance = await fairToken.balanceOf(fairStaking);

      expect(stakingBalance).to.equal(0);

      const txBuyAndDeposit = await tokenTaxDistribution.buyAndDepositTokens();

      await txBuyAndDeposit.wait();

      const stakingBalance1 = await fairToken.balanceOf(fairStaking);

      expect(stakingBalance1).to.above(0);

      const totalSupply = await fairToken.totalSupply();

      expect(totalSupply).to.below(888000000000000000000000000n);
    });
  });
});
