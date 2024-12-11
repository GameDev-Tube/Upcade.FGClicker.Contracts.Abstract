import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ScoreV2TestModule = buildModule("ScoreV2TestModule", (builder) => {
  // Deploy the implementation contract
  const implementation = builder.contract("ScoreV2Test");

  return { implementation };
});

const UpgradeTestModule = buildModule("UpgradeTestModule", (builder) => {
  const { implementation } = builder.useModule(ScoreV2TestModule);

  const proxyAddress = builder.getParameter("proxyAddress");
  const proxy = builder.contractAt("Score", proxyAddress);

  builder.call(proxy, "upgradeToAndCall", [implementation, "0x"]);

  const upgradedProxy = builder.contractAt("ScoreV2Test", proxyAddress)

  return { upgradedProxy };
});

export default UpgradeTestModule;