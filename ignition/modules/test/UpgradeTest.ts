import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import dotenv from 'dotenv';
dotenv.config();

const HighScoreV2TestModule = buildModule("HighScoreV2TestModule", (builder) => {
  // Deploy the implementation contract
  const implementation = builder.contract("HighScoreV2Test");

  return { implementation };
});

const UpgradeTestModule = buildModule("UpgradeTestModule", (builder) => {
  // Get the proxy from the previous module
  const { implementation } = builder.useModule(HighScoreV2TestModule);

  const proxyAddress = builder.getParameter("proxyAddress");
  const proxy = builder.contractAt("HighScore", proxyAddress);

  builder.call(proxy, "upgradeToAndCall", [implementation, "0x"]);

  const upgradedProxy = builder.contractAt("HighScoreV2Test", proxyAddress)

  return { upgradedProxy };
});

export default UpgradeTestModule;