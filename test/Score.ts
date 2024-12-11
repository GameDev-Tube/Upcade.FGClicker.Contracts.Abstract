import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "ethers";

import { ScoreMessage, signMessageWithEIP712, encodeMessage } from "./Utils";
import hre from "hardhat";

const backendPk = "0xcae3bbc4e392118a36d25189a5b11e76915b9a4f2e287762f47aebc69ff05c89";
const backendAddress = "0x9534a32aeA7588531b5F85C612089011e947cD0E";

describe("Score", function () {
  async function deploy() {
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const scoreFactory = await hre.ethers.getContractFactory("Score");
    const scoreContract = await scoreFactory.deploy();
    await scoreContract.initialize(backendAddress);
    const backendSigner = new ethers.Wallet(backendPk, hre.ethers.provider);
    const contractAddress = await scoreContract.getAddress();

    return { contract: scoreContract, owner, otherAccount, backendSigner, contractAddress };
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

  describe("Adding score", function () {
    it("Should validate the signature and change the score", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract, backendSigner, contractAddress } = await loadFixture(deploy);

      const message = new ScoreMessage(player, score, nonce);
      const signature = await signMessageWithEIP712(backendSigner, message, contractAddress);

      await contract.addScore(message, signature);
      const newScore = await contract.scores(player);
      expect(newScore).to.equal(score);
    });

    it("Should validate the signature add the score to the total", async function () {
      const nonce1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
      const nonce2 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
      const player = "0x0000000000000000000000000000000000000001";
      const score = 100_000;

      const { contract, backendSigner, contractAddress } = await loadFixture(deploy);

      const message1 = new ScoreMessage(player, score, nonce1);
      const message2 = new ScoreMessage(player, score, nonce2);
      
      const signature1 = await signMessageWithEIP712(backendSigner, message1, contractAddress);
      const signature2 = await signMessageWithEIP712(backendSigner, message2, contractAddress);

      await contract.addScore(message1, signature1);
      await contract.addScore(message2, signature2);
      const totalScore = await contract.scores(player);
      expect(totalScore).to.equal(score * 2);
    });

    it("Should revert with custom error if nonce is already used", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract, backendSigner, contractAddress } = await loadFixture(deploy);

      const message = new ScoreMessage(player, score, nonce);
      const signature = await signMessageWithEIP712(backendSigner, message, contractAddress);

      await contract.addScore(message, signature);
      await expect(contract.addScore(message, signature)).to.be.revertedWithCustomError(contract, "NonceAlreadyUsed");
    });

    it("Should revert with custom error if signature is invalid", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract, backendSigner, contractAddress } = await loadFixture(deploy);

      const message = new ScoreMessage(player, score, nonce); 
      const signature = await signMessageWithEIP712(backendSigner, message, contractAddress);
      const split = ethers.Signature.from(signature);
      const invalidSignature = ethers.Signature.from({
        r: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        s: split.s,
        v: split.v
      }).serialized;

      await expect(contract.addScore(message, invalidSignature)).to.be.revertedWithCustomError(contract, "ECDSAInvalidSignature");
    });

    it("Should revert with custom error if the signer is not the backend", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract, contractAddress } = await loadFixture(deploy);

      const message = new ScoreMessage(player, score, nonce);
      const randomSigner = ethers.Wallet.createRandom();
      const signature = await signMessageWithEIP712(randomSigner, message, contractAddress);

      await expect(contract.addScore(message, signature)).to.be.revertedWithCustomError(contract, "InvalidSigner");
    });

    it("Should emit a ScoreIncreased event", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract, backendSigner, contractAddress } = await loadFixture(deploy);

      const message = new ScoreMessage(player, score, nonce);
      const signature = await signMessageWithEIP712(backendSigner, message, contractAddress);

      await expect(contract.addScore(message, signature))
        .to.emit(contract, "ScoreIncreased")
        .withArgs(player, score);
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

    it("Should emit a BackendSignerSet event", async function () {
      const { contract, otherAccount } = await loadFixture(deploy);
      await expect(contract.setBackendSigner(otherAccount.address))
        .to.emit(contract, "BackendSignerSet")
        .withArgs(otherAccount.address);
    });
  });

  describe("isMessageEncodingValid", function () {
    it("Should return true if the message is correctly encoded", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract } = await loadFixture(deploy);

      const message = new ScoreMessage(player, score, nonce);
      const encoded = encodeMessage(message);
      const isValid = await contract.isMessageEncodingValid(message, encoded);
      expect(isValid).to.be.true;
    });

    it("Should return false if the message is not correctly encoded", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;

      const { contract } = await loadFixture(deploy);

      const message = new ScoreMessage(player, score, nonce);
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

      const message = new ScoreMessage(player, score, nonce);
      const signature = signMessageWithEIP712(backendSigner, message, contractAddress);
      const signer = await contract.getSigner(message, signature);
      expect(signer).to.equal(backendSigner.address);
    });
  });
});