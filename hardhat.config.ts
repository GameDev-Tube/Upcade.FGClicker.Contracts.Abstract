import { HardhatUserConfig } from "hardhat/config";
// import "@nomicfoundation/hardhat-toolbox";
import "@matterlabs/hardhat-zksync";
// import "@nomicfoundation/hardhat-chai-matchers";

import dotenv from 'dotenv';
dotenv.config();

const privateKey = process.env.PRIVATE_KEY!;

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  defaultNetwork: "hardhat",
  zksolc: {
    version: "latest",
    settings: {
      // Note: This must be true to call NonceHolder & ContractDeployer system contracts
      enableEraVMExtensions: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    abstractTestnet: {
      url: "https://api.testnet.abs.xyz",
      zksync: true,
      ethNetwork: "sepolia",
      verifyURL: "https://api-explorer-verify.testnet.abs.xyz/contract_verification",
      accounts: [privateKey]
    },
  },
};

export default config;
