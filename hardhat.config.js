require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    localhost: {
      timeout: 120000
    },
    hardhat: {
      // forking: {
      //   url: ARBITRUM_TESTNET_URL,
      //   blockNumber: 5495500,
      // },
      allowUnlimitedContractSize: true,
      chainId: 1337,
      maxPriorityFeePerGas: 1000000000,
    },
  },
};
