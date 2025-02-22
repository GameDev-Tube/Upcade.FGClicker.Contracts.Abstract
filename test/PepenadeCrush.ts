import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "ethers";

import { ScoreMessage, signMessageWithEIP712, encodeMessage, MessageFactory } from "./Utils";
import hre from "hardhat";

const backendPk = "0xcae3bbc4e392118a36d25189a5b11e76915b9a4f2e287762f47aebc69ff05c89";
const backendAddress = "0x9534a32aeA7588531b5F85C612089011e947cD0E";

describe("PepenadeCrush", function () {
	async function deploy() {
		const [owner, otherAccount] = await hre.ethers.getSigners();
		const scoreFactory = await hre.ethers.getContractFactory("PepenadeCrush");
		const contract = await scoreFactory.deploy();
		await contract.initialize(backendAddress);
		const backendSigner = new ethers.Wallet(backendPk, hre.ethers.provider);
		const contractAddress = await contract.getAddress();
		const messageFactory = new MessageFactory(contractAddress, backendSigner);

		return { contract: contract, owner, otherAccount, messageFactory, contractAddress };
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

	describe("Updating score", function () {
		it("Should validate the signature and change score values", async function () {

			const totalScore = 1;
			const highScore = 2;
			const crewScore = 3;
			const { contract, messageFactory } = await loadFixture(deploy);
			const { message, signature } = await messageFactory.createMessage(totalScore, highScore, crewScore);

			await contract.updateScore(message, signature);
			const newTotalScore = await contract.totalScore(message.player);
			const newHighScore = await contract.highScore(message.player);
			const newCrewScore = await contract.crewScore(message.player);
			
			expect(newTotalScore).to.equal(totalScore);
			expect(newHighScore).to.equal(highScore);
			expect(newCrewScore).to.equal(crewScore);
		});

		it("Should emit NewHighScore, NewTotalScore and NewCrewScore events", async function () {
			const { contract, messageFactory } = await loadFixture(deploy);
			const { message, signature } = await messageFactory.createMessage();

			await expect(contract.updateScore(message, signature))
				.to.emit(contract, "NewTotalScore")
				.withArgs(message.player, 0, message.totalScore)
				.to.emit(contract, "NewHighScore")
				.withArgs(message.player, 0, message.highScore)
				.to.emit(contract, "NewCrewScore")
				.withArgs(message.player, 0, message.crewScore);
		});

		it("Should emit only events for the scores that have changed", async function () {
			const { contract, messageFactory } = await loadFixture(deploy);
			const { message, signature } = await messageFactory.createMessage(0, 0, 100);

			await expect(contract.updateScore(message, signature))
				.to.emit(contract, "NewCrewScore")
				.withArgs(message.player, 0, message.crewScore)
				.and.not.emit(contract, "NewTotalScore")
				.and.not.emit(contract, "NewHighScore");
		});

		it("Should revert with NonceAlreadyUsed if nonce is already used", async function () {
			const { contract, messageFactory } = await loadFixture(deploy);
			const { message, signature } = await messageFactory.createMessage(100);

			await contract.updateScore(message, signature);

			await expect(contract.updateScore(message, signature)).to.be.revertedWithCustomError(contract, "NonceAlreadyUsed");
		});

		it("Should revert with ECDSAInvalidSignature if signature is invalid", async function () {
			const { contract, messageFactory } = await loadFixture(deploy);
			const { message, signature } = await messageFactory.createMessage(100);
			const split = ethers.Signature.from(signature);
			const invalidSignature = ethers.Signature.from({
				r: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
				s: split.s,
				v: split.v
			}).serialized;

			await expect(contract.updateScore(message, invalidSignature)).to.be.revertedWith("ECDSA: invalid signature");
		});

		it("Should revert with InvalidSigner if the signer is not the backend", async function () {

			const { contract, contractAddress, messageFactory } = await loadFixture(deploy);

			const message = await messageFactory.createUnsignedMessage()
			const randomSigner = ethers.Wallet.createRandom();
			const signature = await signMessageWithEIP712(randomSigner, message, contractAddress);

			await expect(contract.updateScore(message, signature)).to.be.revertedWithCustomError(contract, "InvalidSigner");
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
			await expect(contract.connect(otherAccount).setBackendSigner(otherAccount.address)).to.be.revertedWith("Ownable: caller is not the owner");
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
			const { contract, messageFactory } = await loadFixture(deploy);

			const { message } = await messageFactory.createMessage();
			const encoded = encodeMessage(message);
			const isValid = await contract.isMessageEncodingValid(message, encoded);
			expect(isValid).to.be.true;
		});

		it("Should return false if the message is not correctly encoded", async function () {
			const { contract, messageFactory } = await loadFixture(deploy);

			const message = await messageFactory.createUnsignedMessage();
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

			const { contract, messageFactory } = await loadFixture(deploy);
			const { message, signature } = await messageFactory.createMessage();
			const signer = await contract.getSigner(message, signature);
			expect(signer).to.equal(await messageFactory.getSignerAddress());
		});
	});
});