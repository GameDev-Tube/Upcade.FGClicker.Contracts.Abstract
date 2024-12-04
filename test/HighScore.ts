import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { ethers, AbiCoder, hashMessage } from "ethers";

const backendSigner = "0xfa552727331A154bc19FeF66FCDFcD6eba790718";

function createMessage(player: string, score: number, nonce: string): HighScoreMessage {
  // Creates to be signed with EIP-712
  //   struct HighScoreMessage {
  //     address player;
  //     uint256 score;
  //     string nonce;
  // }
  const message = {
    player,
    score,
    nonce,
  };

  return new HighScoreMessage(player, score, nonce);
}

function encodeMessage(message: HighScoreMessage) {
  const messageHash = ethers.keccak256(
    AbiCoder.defaultAbiCoder().encode(
      [
        "bytes32",
        "address",
        "uint256",
        "bytes32",
      ],
      [
        ethers.keccak256(
          ethers.toUtf8Bytes("HighScoreMessage(address player,uint256 score,string nonce)")
        ),
        message.player,
        message.score,
        ethers.keccak256(ethers.toUtf8Bytes(message.nonce)),
      ]
    )
  );

  return messageHash;
}

function encodeMessageToBytes(message: HighScoreMessage) {
  const encoded = encodeMessage(message);
  return ethers.toUtf8Bytes(encoded);
}

describe("HighScore", function () {
  async function deploy() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const highScoreFactory = await hre.ethers.getContractFactory("HighScore");
    const highScoreContract = await highScoreFactory.deploy(backendSigner);
    return { contract: highScoreContract, owner, otherAccount };
  }

  describe("Setting high-score", function () {
    it("Should validate the signature and change the highscore", async function () {
      const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
      const signature = "0xe63277c1513d81559f20e90aa426ec703eba3e79a89c46ca9fee83c6bb39e6b66685e17b4448ff078ba824d8a54e0436aee31b45a47aff24fa5b2a11d96b63001b";
      const player = "0x96C15A68B5620DcbE86EC199E866Da5B6519Cd3D";
      const score = 100_000;
      const chainId = 1337;
      const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

      const { contract } = await loadFixture(deploy);
      const currentChainId = await hre.ethers.provider.getNetwork().then((network) => network.chainId);
      expect(currentChainId).to.equal(chainId);
      const currentContractAddress = await contract.getAddress();
      expect(currentContractAddress).to.equal(contractAddress);

      const message = createMessage(player, score, nonce);
      const encoded = encodeMessage(message);
      const bytes = encodeMessageToBytes(message);
      console.log("Encoded message: ", encoded);
      console.log("Bytes: ", bytes);

      const encodedBySoldity = await contract.hashMessage(message);
      console.log("Encoded by Solidity: ", encodedBySoldity);

      const signer = await contract.getSigner(message, signature);
      expect(signer).to.equal(backendSigner);
    });
  });
});

class HighScoreMessage {
  player: string;
  score: number;
  nonce: string;

  constructor(player: string, score: number, nonce: string) {
    this.player = player;
    this.score = score;
    this.nonce = nonce;
  }
}

