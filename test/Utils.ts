import { ethers, AbiCoder } from "ethers";

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
  
  async function signMessageWithEIP712(signer: ethers.Signer, message: HighScoreMessage, verifyingContract: string) {
  
    const domain = {
      name: "HighScore",
      version: "1",
      chainId: 1337,
      verifyingContract: verifyingContract,
    };
  
    const types = {
      HighScoreMessage: [
        { name: "player", type: "address" },
        { name: "score", type: "uint256" },
        { name: "nonce", type: "string" },
      ],
    };
  
    const signature = await signer.signTypedData(domain, types, message);
    return signature;
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

  export { HighScoreMessage, signMessageWithEIP712, encodeMessage };