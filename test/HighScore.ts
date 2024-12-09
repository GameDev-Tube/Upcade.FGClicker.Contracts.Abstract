import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "ethers";

import { HighScoreMessage, signMessageWithEIP712, encodeMessage } from "./Utils";
import hre from "hardhat";

const backendPk = "0xcae3bbc4e392118a36d25189a5b11e76915b9a4f2e287762f47aebc69ff05c89";
const backendAddress = "0x9534a32aeA7588531b5F85C612089011e947cD0E";

describe("HighScore", function () {
  async function deploy() {
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const highScoreFactory = await hre.ethers.getContractFactory("HighScore");
    const highScoreContract = await highScoreFactory.deploy();
    await highScoreContract.initialize(backendAddress);
    const backendSigner = new ethers.Wallet(backendPk, hre.ethers.provider);
    const contractAddress = await highScoreContract.getAddress();

    return { contract: highScoreContract, owner, otherAccount, backendSigner, contractAddress };
  }

  describe("Initialization", function () {
    it("Should initialize the contract with the backend signer", async function () {
      const { contract } = await loadFixture(deploy);
      const backendSigner = await contract.backendSigner();
      expect(backendSigner).to.equal(backendAddress);
    });

    it("Should initialize the contract with the message sender as the owner", async function () {
      const { contract, owner } = await loadFixture(deploy);
      const ownerAddress = await contract.owner();
      expect(ownerAddress).to.equal(owner.address);
    });
  });

  describe("Setting high-score", function () {
    it("Should validate the signature and change the highscore", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract, backendSigner, contractAddress } = await loadFixture(deploy);

      const message = new HighScoreMessage(player, score, nonce);
      const signature = await signMessageWithEIP712(backendSigner, message, contractAddress);

      await contract.setHighScore(message, signature);
      const highScore = await contract.highScores(player);
      expect(highScore).to.equal(score);
    });

    it("Should revert with custom error if nonce is already used", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract, backendSigner, contractAddress } = await loadFixture(deploy);

      const message = new HighScoreMessage(player, score, nonce);
      const signature = await signMessageWithEIP712(backendSigner, message, contractAddress);

      await contract.setHighScore(message, signature);
      await expect(contract.setHighScore(message, signature)).to.be.revertedWithCustomError(contract, "NonceAlreadyUsed");
    });

    it("Should revert with custom error if signature is invalid", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract, backendSigner, contractAddress } = await loadFixture(deploy);

      const message = new HighScoreMessage(player, score, nonce);
      const signature = await signMessageWithEIP712(backendSigner, message, contractAddress);

      const invalidSignature = signature.replace("a", "b");
      await expect(contract.setHighScore(message, invalidSignature)).to.be.revertedWithCustomError(contract, "ECDSAInvalidSignature");
    });

    it("Should revert with custom error if the signer is not the backend", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract, contractAddress } = await loadFixture(deploy);

      const message = new HighScoreMessage(player, score, nonce);
      const randomSigner = ethers.Wallet.createRandom();
      const signature = await signMessageWithEIP712(randomSigner, message, contractAddress);

      await expect(contract.setHighScore(message, signature)).to.be.revertedWithCustomError(contract, "InvalidSigner");
    });

    it("Should revert with custom error if the new score is not higher than the previous one", async function () {
      const nonce = "aaaaaaaa-a87d-4298-9358-a08990a4f878";
      const nonce2 = "bbbbbbbb-a87d-4298-9358-a08990a4f879";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract, backendSigner, contractAddress } = await loadFixture(deploy);

      const message = new HighScoreMessage(player, score, nonce);
      const signature = await signMessageWithEIP712(backendSigner, message, contractAddress);

      await contract.setHighScore(message, signature);
      const highScore = await contract.highScores(player);
      expect(highScore).to.equal(score);

      const lowerScore = 50_000;
      const lowerMessage = new HighScoreMessage(player, lowerScore, nonce2);
      const lowerSignature = await signMessageWithEIP712(backendSigner, lowerMessage, contractAddress);

      await expect(contract.setHighScore(lowerMessage, lowerSignature)).to.be.revertedWithCustomError(contract, "ScoreNotHigher");
    });

    it("Should emit a HighScoreSet event", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract, backendSigner, contractAddress } = await loadFixture(deploy);

      const message = new HighScoreMessage(player, score, nonce);
      const signature = await signMessageWithEIP712(backendSigner, message, contractAddress);

      await expect(contract.setHighScore(message, signature))
        .to.emit(contract, "HighScoreSet")
        .withArgs(player, 0, score);
    });
  });

  describe("setBackendSigner", function () {
    it("Should change the backend signer", async function () {
      const { contract, otherAccount } = await loadFixture(deploy);
      await contract.setBackendSigner(otherAccount.address);
      const backendSigner = await contract.backendSigner();
      expect(backendSigner).to.equal(otherAccount.address);
    });

    it("Should revert with an error if the caller is not the owner", async function () {
      const { contract, otherAccount } = await loadFixture(deploy);
      await expect(contract.connect(otherAccount).setBackendSigner(otherAccount.address)).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
  });

  describe("isMessageEncodingValid", function () {
    it("Should return true if the message is correctly encoded", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract } = await loadFixture(deploy);

      const message = new HighScoreMessage(player, score, nonce);
      const encoded = encodeMessage(message);
      const isValid = await contract.isMessageEncodingValid(message, encoded);
      expect(isValid).to.be.true;
    });

    it("Should return false if the message is not correctly encoded", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract } = await loadFixture(deploy);

      const message = new HighScoreMessage(player, score, nonce);
      const encoded = encodeMessage(message);
      const isValid = await contract.isMessageEncodingValid(message, encoded.replace("a", "b"));
      expect(isValid).to.be.false;
    });
  });

  describe("getSigner", function () {
    it("Should return the signer of the message", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract, backendSigner, contractAddress } = await loadFixture(deploy);

      const message = new HighScoreMessage(player, score, nonce);
      const signature = signMessageWithEIP712(backendSigner, message, contractAddress);
      const signer = await contract.getSigner(message, signature);
      expect(signer).to.equal(backendSigner.address);
    });
  });
});