import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const HighScoreModule = buildModule("HighScoreModule", (m) => {
  const _backendSigner = m.getParameter("_backendSigner", "0xfa552727331A154bc19FeF66FCDFcD6eba790718");

  const highScore = m.contract("HighScore", [_backendSigner], {
  });

  return { highScore };
});

export default HighScoreModule;
