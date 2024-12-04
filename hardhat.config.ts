import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import dotenv from 'dotenv';
dotenv.config();

const privateKey = process.env.PRIVATE_KEY!;

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    alephZeroEvmTestnet: {
      url: 'https://rpc.alephzero-testnet.gelato.digital',
      chainId: 2039,
      accounts: [privateKey]
    }
  },
};

export default config;
