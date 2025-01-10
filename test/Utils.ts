import { ethers, AbiCoder } from "ethers";
import { v4 as guid } from "uuid";

class MessageFactory {
  contractAddress: string;
  signer: ethers.Signer;

  constructor(contractAddress: string, signer: ethers.Signer) {
    this.contractAddress = contractAddress;
    this.signer = signer;
  }

  async createCrewMessage(score: number = 100, player: string = "", nonce: string = "") {
    return createCrewMessage(this.signer, this.contractAddress, nonce, score);
  }

  async createMessage(score: number = 100, player: string = "", nonce: string = "") {
    return createMessage(this.signer, this.contractAddress, nonce, score, player);
  }

  async getSignerAddress() {
    return this.signer.getAddress();
  }
}

class ScoreMessage {
  player: string;
  score: number;
  nonce: string;

  constructor(player: string, score: number, nonce: string) {
    this.player = player;
    this.score = score;
    this.nonce = nonce;
  }
}

class CrewScoreMessage {
  player: string;
  score: number;
  nonce: string;

  constructor(player: string, score: number, nonce: string) {
    this.player = player;
    this.score = score;
    this.nonce = nonce;
  }
}

async function createMessage(signer: ethers.Signer, verifyingContract: string, nonce: string = "", score: number = 100, player: string = "") {
  if (nonce === "") {
    nonce = guid();
  }

  if (player === "") {
    player = await signer.getAddress();
  }

  const message = new ScoreMessage(player, score, nonce);
  const signature = await signMessageWithEIP712(signer, message, verifyingContract);
  return { message, signature };
}

async function createCrewMessage(signer: ethers.Signer, verifyingContract: string, nonce: string = "", score: number = 100, player: string = "") {
  if (nonce === "") {
    nonce = guid();
  }

  if (player === "") {
    player = await signer.getAddress();
  }

  const message = new CrewScoreMessage(player, score, nonce);
  const signature = await signCrewMessageWithEIP712(signer, message, verifyingContract);
  return { message, signature };
}

async function signCrewMessageWithEIP712(signer: ethers.Signer, message: CrewScoreMessage, verifyingContract: string) {

  const domain = {
    name: "PepenadeCrush",
    version: "1",
    chainId: 1337,
    verifyingContract: verifyingContract,
  };

  const types = {
    CrewScoreMessage: [
      { name: "player", type: "address" },
      { name: "score", type: "uint256" },
      { name: "nonce", type: "string" },
    ],
  };

  const signature = await signer.signTypedData(domain, types, message);
  return signature;
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
      { name: "score", type: "uint256" },
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
        "bytes32",
      ],
      [
        ethers.keccak256(
          ethers.toUtf8Bytes("ScoreMessage(address player,uint256 score,string nonce)")
        ),
        message.player,
        message.score,
        ethers.keccak256(ethers.toUtf8Bytes(message.nonce)),
      ]
    )
  );

  return messageHash;
}

export { ScoreMessage, signMessageWithEIP712, encodeMessage, createMessage, MessageFactory };