// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

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

    event HighScoreSet(
        address player,
        uint256 previousScore,
        uint256 currentScore
    );

    mapping(address => uint256) public highScores;
    mapping(string => bool) public nonces;

    /// @param _backendSigner The address of the backend wallet that will sign the messages
    constructor(address _backendSigner) EIP712("HighScore", "1") {
        backendSigner = _backendSigner;
    }

    /// @notice Sets the high score for a player
    /// @param message The message containing the player address, score and nonce
    /// @param signature The signature of the message signed by the backend wallet
    function setHighScore(
        HighScoreMessage memory message,
        bytes memory signature
    ) external {
        require(!_nonceUsed(message.nonce), "HighScore: nonce already used"); // TODO custom error
        require(
            _verifySignature(message, signature),
            "HighScore: invalid signature"
        ); // TODO custom error

        uint256 previousScore = highScores[message.player];
        uint256 currentScore = message.score;
        require(
            currentScore > previousScore,
            "HighScore: score is not higher than the previous one"
        ); // TODO custom error

        highScores[message.player] = message.score;
        nonces[message.nonce] = true;
        emit HighScoreSet(message.player, previousScore, message.score);
    }

    /// @notice Debug function to check if the message encoding is valid
    /// @param message The message containing the player address, score and nonce
    /// @param encodedMessage Hashed, ABI encoded message
    function isMessageEncodingValid(
        HighScoreMessage memory message,
        bytes32 encodedMessage
    ) public view returns (bool) {
        return _verifyMessage(message, encodedMessage);
    }

    /// @notice Debug function to get the signer of a message
    /// @param message The message containing the player address, score and nonce
    /// @param signature The signature of the message
    function getSigner(
        HighScoreMessage memory message,
        bytes memory signature
    ) public view returns (address) {
        return
            ECDSA.recover(_hashTypedDataV4(_hashMessage(message)), signature);
    }

    /// @notice Debug function to hash a message
    /// @param message The message containing the player address, score and nonce
    function hashMessage(
        HighScoreMessage memory message
    ) public pure returns (bytes32) {
        return _hashMessage(message);
    }

    /// @notice Checks if the nonce was already used
    /// @param nonce The nonce to check
    /// @return bool
    function _nonceUsed(string memory nonce) internal view returns (bool) {
        return nonces[nonce];
    }

    /// @notice Verifies if the message was constructed correctly
    /// @param message The message containing the player address, score, nonce
    /// @param rawMessage The raw message
    /// @return bool
    function _verifyMessage(
        HighScoreMessage memory message,
        bytes32 rawMessage
    ) internal view returns (bool) {
        bytes32 expectedDigest = _hashTypedDataV4(_hashMessage(message));
        bytes32 digest = _hashTypedDataV4(rawMessage);
        return expectedDigest == digest;
    }

    /// @notice Verifies if the message was signed by the backend wallet
    /// @param message The message containing the player address, score, nonce
    /// @param signature The signature of the message
    /// @return bool
    function _verifySignature(
        HighScoreMessage memory message,
        bytes memory signature
    ) internal view returns (bool) {
        bytes32 digest = _hashTypedDataV4(_hashMessage(message));
        address signer = ECDSA.recover(digest, signature);
        return signer == backendSigner;
    }

    /// @notice ABI encodes the message and hashes it using keccak256
    /// @param message The message containing the player address, score, nonce
    /// @return bytes32
    function _hashMessage(
        HighScoreMessage memory message
    ) private pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "HighScoreMessage(address player,uint256 score,string nonce)"
                    ),
                    message.player,
                    message.score,
                    keccak256(bytes(message.nonce))
                )
            );
    }
}
