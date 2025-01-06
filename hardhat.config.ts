import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@matterlabs/hardhat-zksync";
import "@nomicfoundation/hardhat-chai-matchers";

import dotenv from 'dotenv';
dotenv.config();

const privateKey = process.env.PRIVATE_KEY || "0xcae3bbc4e392118a36d25189a5b11e76915b9a4f2e287762f47aebc69ff05c89";

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
    alephZeroEvmTestnet: {
      url: 'https://rpc.alephzero-testnet.gelato.digital',
      chainId: 2039,
      accounts: [privateKey]
    },
    zetachainTestnet: {
      url: "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
      chainId: 7001,
      accounts: [privateKey]
    },
    alephZeroEvmMainnet: {
      url: 'https://rpc.alephzero.raas.gelato.cloud',
      chainId: 41455,
      accounts: [privateKey]
    },
    zetachainMainnet: {
      url: "https://zetachain-evm.blockpi.network/v1/rpc/public",
      chainId: 7000,
      accounts: [privateKey]
    },
    abstractTestnet: {
      url: "https://api.testnet.abs.xyz",
      zksync: true,
      ethNetwork: "sepolia",
      verifyURL: "https://api-explorer-verify.testnet.abs.xyz/contract_verification",
      accounts: [privateKey]
    },
  },
//   etherscan: {
//     apiKey: {
//       'alephZeroEvmTestnet': 'empty',
//       'alephZeroEvmMainnet': 'empty',
//       'zetachainTestnet': 'empty',
//       'zetachainMainnet': 'empty',
//       'abstractTestnet': 'empty'
//     },
//     customChains: [
//       {
//         network : "abstractTestnet",
//         chainId: 11124,
//         urls: {
//           browserURL: "https://api.testnet.abs.xyz/",
//           apiURL: "https://api-explorer-verify.testnet.abs.xyz/contract_verification"
//         }
//       },
//       {
//         network: "alephZeroEvmTestnet",
//         chainId: 2039,
//         urls: {
//           apiURL: "https://evm-explorer-testnet.alephzero.org/api",
//           browserURL: "https://evm-explorer-testnet.alephzero.org"
//         }
//       },
//       {
//         network: "alephZeroEvmMainnet",
//         chainId: 41455,
//         urls: {
//           apiURL: "https://evm-explorer.alephzero.org/api",
//           browserURL: "https://evm-explorer.alephzero.org/"
//         }
//       },
//       {
//         network: "zetachainTestnet",
//         chainId: 7001,
//         urls: {
//           apiURL: "https://zetachain-testnet.blockscout.com/api",
//           browserURL: "https://zetachain-testnet.blockscout.com"
//         }
//       },
//       {
//         network: "zetachainMainnet",
//         chainId: 7000,
//         urls: {
//           apiURL: "https://zetachain.blockscout.com/api",
//           browserURL: "https://zetachain.blockscout.com/"

//         }
//       }
//     ]
//   }
};

export default config;
