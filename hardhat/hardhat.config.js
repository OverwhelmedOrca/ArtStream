require("@nomiclabs/hardhat-ethers");
require('dotenv').config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    theta_testnet: {
      url: "https://eth-rpc-api-testnet.thetatoken.org/rpc",
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};