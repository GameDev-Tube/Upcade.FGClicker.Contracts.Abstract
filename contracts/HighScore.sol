// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title HighScore contract
/// @notice UUPS upgradable contract, used to store the high score for Pepenade Crush game by utilizing EIP-712 standard
contract HighScore is
    Initializable,
    UUPSUpgradeable,
    EIP712Upgradeable,
    Ownable2StepUpgradeable
{
    /// @notice The address of the backend wallet that will sign the messages
    address public backendSigner;

    /// @notice The message struct containing the player address, score and nonce
    struct HighScoreMessage {
        address player;
        uint256 score;
        string nonce;
    }

    /// @notice Event emitted when a high score is set
    event HighScoreSet(address player, uint256 currentScore, uint256 newScore);

    /// @notice Event emitted when the backend wallet address is set
    event BackendSignerSet(address backendSigner);

    /// @dev Custom errors
    error NonceAlreadyUsed(string nonce);
    error InvalidSigner();
    error ScoreNotHigher(uint currentScore, uint newScore);

    /// @notice Mapping of player address to their high score
    mapping(address => uint256) public highScores;

    /// @notice Mapping of nonces to check if they were already used
    mapping(string => bool) public nonces;

    /// @notice Initializes the contract with the backend wallet address and the deployer as the owner
    /// @param _backendSigner The address of the backend wallet
    function initialize(address _backendSigner) external initializer {
        __Ownable_init(msg.sender);
        __EIP712_init("HighScore", "1");
        setBackendSigner(_backendSigner);
    }

    /// @notice Sets the high score for a player
    /// @param message The message containing the player address, score and nonce
    /// @param signature The signature of the message signed by the backend wallet
    function setHighScore(
        HighScoreMessage memory message,
        bytes memory signature
    ) external {
        if (_nonceUsed(message.nonce)) {
            revert NonceAlreadyUsed(message.nonce);
        }

        if (!_verifySignature(message, signature)) {
            revert InvalidSigner();
        }

        uint256 currentScore = highScores[message.player];
        uint256 newScore = message.score;
        if (newScore <= currentScore) {
            revert ScoreNotHigher(currentScore, newScore);
        }

        highScores[message.player] = newScore;
        nonces[message.nonce] = true;
        emit HighScoreSet(message.player, currentScore, newScore);
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

    /// @notice Sets the backend wallet address. Can only be called by the owner
    /// @param _backendSigner The address of the backend wallet
    function setBackendSigner(address _backendSigner) public onlyOwner {
        backendSigner = _backendSigner;
        emit BackendSignerSet(_backendSigner);
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

    /// @dev Verifies if the message was constructed correctly
    /// @param message The message containing the player address, score, nonce
    /// @param rawMessage The raw message
    /// @return bool
    function _verifyMessage(
        HighScoreMessage memory message,
        bytes32 rawMessage
    ) private view returns (bool) {
        bytes32 expectedDigest = _hashTypedDataV4(_hashMessage(message));
        bytes32 digest = _hashTypedDataV4(rawMessage);
        return expectedDigest == digest;
    }

    /// @dev Checks if the nonce was already used
    /// @param nonce The nonce to check
    /// @return bool
    function _nonceUsed(string memory nonce) private view returns (bool) {
        return nonces[nonce];
    }

    /// @dev Verifies if the message was signed by the backend wallet
    /// @param message The message containing the player address, score, nonce
    /// @param signature The signature of the message
    /// @return bool
    function _verifySignature(
        HighScoreMessage memory message,
        bytes memory signature
    ) private view returns (bool) {
        bytes32 digest = _hashTypedDataV4(_hashMessage(message));
        address signer = ECDSA.recover(digest, signature);
        return signer == backendSigner;
    }

    /// @dev ABI encodes the message and hashes it using keccak256
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

    /// @dev Upgrades the contract to a new implementation
    /// @param newImplementation The address of the new implementation
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
