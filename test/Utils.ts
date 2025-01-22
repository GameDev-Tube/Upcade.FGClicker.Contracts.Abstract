import { ethers, AbiCoder } from "ethers";
import { v4 as guid } from "uuid";

const defaultPlayer = "0xfa552727331A154bc19FeF66FCDFcD6eba790718";

class MessageFactory {
  contractAddress: string;
  signer: ethers.Signer;

  constructor(contractAddress: string, signer: ethers.Signer) {
    this.contractAddress = contractAddress;
    this.signer = signer;
  }

  async createMessage(totalScore: number = 100, highScore: number = 100, crewScore: number = 100, player: string = "", nonce: string = "", signer: ethers.Signer = this.signer) {
    player = player === "" ? defaultPlayer : player;
    nonce = nonce === "" ? guid() : nonce;
    return createMessage(signer, this.contractAddress, nonce, totalScore, highScore, crewScore, player);
  }

  async createUnsignedMessage(){
    return new ScoreMessage("0xfa552727331A154bc19FeF66FCDFcD6eba790718", 0, 0, 0, "cce5dd6b-ccac-430b-bc40-89d334166940");
  }

  async getSignerAddress() {
    return this.signer.getAddress();
  }
}

class ScoreMessage {
  player: string;
  totalScore: number;
  highScore: number;
  crewScore: number;
  nonce: string;

  constructor(player: string, totalScore: number, highScore: number, crewScore: number, nonce: string) {
    this.player = player;
    this.totalScore = totalScore;
    this.highScore = highScore;
    this.crewScore = crewScore;
    this.nonce = nonce;
  }
}

async function createMessage(
  signer: ethers.Signer,
  verifyingContract: string,
  nonce: string = "",
  totalScore: number = 100,
  highScore: number = 100,
  crewScore: number = 100,
  player: string = "") {
  if (nonce === "") {
    nonce = guid();
  }

  if (player === "") {
    player = await signer.getAddress();
  }

  const message = new ScoreMessage(player, totalScore, highScore, crewScore, nonce);
  const signature = await signMessageWithEIP712(signer, message, verifyingContract);
  return { message, signature };
}

async function signMessageWithEIP712(signer: ethers.Signer, message: ScoreMessage, verifyingContract: string) {

  const domain = {
    name: "PepenadeCrush",
    version: "1",
    chainId: 1337,
    verifyingContract: verifyingContract,
  };

  const types = {
    ScoreMessage: [
      { name: "player", type: "address" },
      { name: "totalScore", type: "uint256" },
      { name: "highScore", type: "uint256" },
      { name: "crewScore", type: "uint256" },
      { name: "nonce", type: "string" },
    ],
  };

  const signature = await signer.signTypedData(domain, types, message);
  return signature;
}

function encodeMessage(message: ScoreMessage) {
  const messageHash = ethers.keccak256(
    AbiCoder.defaultAbiCoder().encode(
      [
        "bytes32",
        "address",
        "uint256",
        "uint256",
        "uint256",
        "bytes32",
      ],
      [
        ethers.keccak256(
          ethers.toUtf8Bytes("ScoreMessage(address player,uint256 totalScore,uint256 highScore,uint256 crewScore,string nonce)")
        ),
        message.player,
        message.totalScore,
        message.highScore,
        message.crewScore,
        ethers.keccak256(ethers.toUtf8Bytes(message.nonce)),
      ]
    )
  );

  return messageHash;
}

export { ScoreMessage, signMessageWithEIP712, encodeMessage, createMessage, MessageFactory };