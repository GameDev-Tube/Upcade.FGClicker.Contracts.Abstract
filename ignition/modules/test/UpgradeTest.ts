import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PepenadeCrushV2TestModule = buildModule("PepenadeCrushV2TestModule", (builder) => {
  // Deploy the implementation contract
  const implementation = builder.contract("PepenadeCrushV2Test");

  return { implementation };
});

const UpgradeTestModule = buildModule("UpgradeTestModule", (builder) => {
  const { implementation } = builder.useModule(PepenadeCrushV2TestModule);

  const proxyAddress = builder.getParameter("proxyAddress");
  const proxy = builder.contractAt("PepenadeCrush", proxyAddress);

  builder.call(proxy, "upgradeToAndCall", [implementation, "0x"]);

  const upgradedProxy = builder.contractAt("PepenadeCrushV2Test", proxyAddress)

  return { upgradedProxy };
});

export default UpgradeTestModule;