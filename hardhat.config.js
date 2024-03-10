require("@nomicfoundation/hardhat-toolbox");

const AVALANCHE_MAIN_PRIVATE_KEY =
  "da22214dc550c60776cf3009bb7bcfc8f5d38b7e8399db86ff072f520a1bc160"; // avax

module.exports = {
  solidity: "0.8.23",
  networks: {
    mainnet: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      gasPrice: 160000000000,
      chainId: 43114,
      accounts: [`${AVALANCHE_MAIN_PRIVATE_KEY}`],
    },
    sepiola: {
      url: "https://ethereum-sepolia.publicnode.com",
      accounts: [`${AVALANCHE_MAIN_PRIVATE_KEY}`],
    },
    goerli: {
      url: "https://goerli.drpc.org/",
      accounts: [`${AVALANCHE_MAIN_PRIVATE_KEY}`],
    },
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: [`${AVALANCHE_MAIN_PRIVATE_KEY}`],
    },
    arbitrumOne: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [`${AVALANCHE_MAIN_PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: "8K56SNZWH1IKYVWTV1GJ3FDWN91PV55RKS",
  },
};
// npx hardhat verify --network sepiola 0x0fA8b62c2e3F9EBf63e43Ea4a1F706Fd6f5108dF 0x8216A525944FE19e0DB5e4CE64726ac8b0E77313 0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008 0xbe72e441bf55620febc26715db68d3494213d8cb
