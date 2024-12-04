import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import dotenv from 'dotenv';
dotenv.config();

const ProxyModule = buildModule("ProxyModule", (builder) => {
  // Deploy the implementation contract
  const implementation = builder.contract("HighScore");

  // Encode the initialize function call
  const initialize = builder.encodeFunctionCall(implementation, 'initialize', [
    builder.getParameter("_backendSigner", process.env.BACKEND_WALLET_ADDRESS!)
  ]);

  // Deploy the ERC1967Proxy pointing to the implementation contract
  const proxy = builder.contract('ERC1967Proxy', [implementation, initialize]);

  return { proxy };
});

const HighScoreModule = buildModule("HighScoreModule", (builder) => {
  // Get the proxy from the previous module
  const { proxy } = builder.useModule(ProxyModule);

  // Create a contract instance using the deployed proxy's address
  const instance = builder.contractAt("HighScore", proxy);

  return { instance, proxy };
});

export default HighScoreModule;