import { ethers, AbiCoder } from "ethers";

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
  
  async function signMessageWithEIP712(signer: ethers.Signer, message: ScoreMessage, verifyingContract: string) {
  
    const domain = {
      name: "Score",
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

  export { ScoreMessage, signMessageWithEIP712, encodeMessage };