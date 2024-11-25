// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title HighScore contract
/// @notice This contract is used to store the high score for Pepenade Crush game by utilizing EIP-712 standard
contract HighScore is EIP712 {
    // adres backendu, który będzie podpisywał wiadomości
    address public backendSigner;

    struct HighScoreMessage {
        address player;
        uint256 score;
        string nonce;
    }

    event HighScoreSet(address player, uint256 score);

    mapping(address => uint256) public highScores;
    mapping(string => bool) public nonces;

    /// @notice This function is used to initialize the contract
    /// @param _backendSigner The address of the backend wallet
    constructor(address _backendSigner) EIP712("HighScore", "1") {
        backendSigner = _backendSigner;
    }

    /// @notice This function is used to set the high score for a player
    /// @param message The message containing the player address, score, nonce and signature
    function setHighScore(HighScoreMessage memory message, bytes memory signature) external {
        require(!_nonceUsed(message.nonce), "HighScore: nonce already used");
        require(_verifySignature(message, signature), "HighScore: invalid signature");

        highScores[message.player] = message.score;
        nonces[message.nonce] = true;

        emit HighScoreSet(message.player, message.score);
    }

    /// @notice This function is used to check if a nonce has already been used
    /// @param nonce The nonce to check
    /// @return bool
    function _nonceUsed(string memory nonce) internal view returns (bool) {
        return nonces[nonce];
    }

    /// @notice This function is used to verify if the message was signed by the backend wallet
    /// @param message The message containing the player address, score, nonce
    /// @param signature The signature of the message
    /// @return bool
    function _verifySignature(
        HighScoreMessage memory message,
        bytes memory signature
    ) internal view returns (bool) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("HighScoreMessage(address player,uint256 score,string nonce)"),
                    message.player,
                    message.score,
                    keccak256(bytes(message.nonce))
                )
            )
        );

        address signer = ECDSA.recover(digest, signature);
        return signer == backendSigner;
    }
}
