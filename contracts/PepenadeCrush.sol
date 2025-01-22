// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title Fear & Greed: Pepenade Crush
/// @notice A contract to manage the scores of the players in the Pepenade Crush minigame
contract PepenadeCrush is
    Initializable,
    UUPSUpgradeable,
    EIP712Upgradeable,
    OwnableUpgradeable
{
    /// @notice The message struct containing the player address, score and nonce
    struct ScoreMessage {
        address player;
        uint256 totalScore;
        uint256 highScore;
        uint256 crewScore;
        string nonce;
    }

    /// @notice Event emitted when player's total score is updated
    event NewTotalScore(
        address indexed player,
        uint256 previousScore,
        uint256 newScore
    );

    /// @notice Event emitted when player reaches new high score
    event NewHighScore(
        address indexed player,
        uint256 previousHighScore,
        uint256 newHighScore
    );

    /// @notice Event emitted when player's crew reaches new total score
    event NewCrewScore(
        address indexed player,
        uint256 previousScore,
        uint256 newScore
    );

    /// @notice Event emitted when the backend wallet address is set
    event BackendSignerSet(address backendSigner);

    /// @dev Custom errors
    error NonceAlreadyUsed(string nonce);
    error InvalidSigner();

    /// @notice The address of the backend wallet that will sign the messages
    address public backendSigner;

    /// @notice Mapping of player address to their total score
    mapping(address => uint256) public totalScore;

    /// @notice Mapping of player address to their high score
    mapping(address => uint256) public highScore;

    /// @notice Mapping of crew address to their high score
    mapping(address => uint256) public crewScore;

    /// @notice Mapping of nonce to a boolean indicating if it was already used
    mapping(string => bool) public nonces;

    /// @notice Initializes the contract with the backend wallet address and the deployer as the owner
    /// @param _backendSigner The address of the backend wallet
    function initialize(address _backendSigner) external initializer {
        __Ownable_init();
        __EIP712_init("PepenadeCrush", "1");
        _setBackendSigner(_backendSigner);
    }

    /// @notice Adds a score to a player's current score
    /// @param message The message containing the player address, score and nonce
    /// @param signature The signature of the message signed by the backend wallet
    function updateScore(
        ScoreMessage memory message,
        bytes memory signature
    ) external {
        _verifySignature(message, signature);
        _consumeNonce(message.nonce);
        _updateScore(
            message.player,
            message.totalScore,
            message.highScore,
            message.crewScore
        );
    }

    /// @dev Updates all scores for a player
    /// @dev Has no signature verification, nonce consumption or authorization checks
    /// @param player The address of the player
    /// @param _totalScore The new total score
    /// @param _highScore The new high score
    /// @param _crewScore The new crew score
    function _updateScore(
        address player,
        uint256 _totalScore,
        uint256 _highScore,
        uint256 _crewScore
    ) private {
        _updateTotalScore(player, _totalScore);
        _updateHighScore(player, _highScore);
        _updateCrewScore(player, _crewScore);
    }

    /// @dev Updates the total score of a player
    /// @param player The address of the player
    /// @param score The new total score
    function _updateTotalScore(address player, uint256 score) private {
        uint256 previousScore = totalScore[player];
        if (score <= previousScore) {
            return;
        }

        totalScore[player] = score;
        emit NewTotalScore(player, previousScore, score);
    }

    /// @dev Updates the high score of a player
    /// @param player The address of the player
    /// @param score The new high score
    function _updateHighScore(address player, uint256 score) private {
        uint256 previousScore = highScore[player];
        if (score <= previousScore) {
            return;
        }

        highScore[player] = score;
        emit NewHighScore(player, previousScore, score);
    }

    /// @dev Updates the crew score of a player
    /// @param player The address of the player
    /// @param score The new crew score
    function _updateCrewScore(address player, uint256 score) private {
        uint256 previousScore = crewScore[player];
        if (score <= previousScore) {
            return;
        }

        crewScore[player] = score;
        emit NewCrewScore(player, previousScore, score);
    }

    /// @notice Utility function to check if the message encoding is valid
    /// @param message The message containing the player address, score and nonce
    /// @param encodedMessage Hashed, ABI encoded message
    function isMessageEncodingValid(
        ScoreMessage memory message,
        bytes32 encodedMessage
    ) public view returns (bool) {
        return _verifyMessage(message, encodedMessage);
    }

    /// @notice Utility function to get the signer of a message
    /// @param message The message containing the player address, score and nonce
    /// @param signature The signature of the message
    function getSigner(
        ScoreMessage memory message,
        bytes memory signature
    ) public view returns (address) {
        return
            ECDSA.recover(_hashTypedDataV4(_hashMessage(message)), signature);
    }

    /// @notice Sets the backend wallet address. Can only be called by the owner
    /// @param _backendSigner The address of the backend wallet
    function setBackendSigner(address _backendSigner) external onlyOwner {
        _setBackendSigner(_backendSigner);
    }

    /// @dev Verifies if the message was constructed correctly
    /// @param message The message containing the player address, score, nonce
    /// @param rawMessage The raw message
    /// @return bool
    function _verifyMessage(
        ScoreMessage memory message,
        bytes32 rawMessage
    ) private view returns (bool) {
        bytes32 expectedDigest = _hashTypedDataV4(_hashMessage(message));
        bytes32 digest = _hashTypedDataV4(rawMessage);
        return expectedDigest == digest;
    }

    /// @dev Verifies if the message was signed by the backend wallet. Reverts with InvalidSigner if not
    /// @param message The message containing the player address, score, nonce
    /// @param signature The signature of the message
    function _verifySignature(
        ScoreMessage memory message,
        bytes memory signature
    ) private view {
        bytes32 digest = _hashTypedDataV4(_hashMessage(message));
        address signer = ECDSA.recover(digest, signature);
        if (signer != backendSigner) {
            revert InvalidSigner();
        }
    }

    /// @notice Sets the backend wallet address
    /// @param _backendSigner The address of the backend wallet
    /// @dev Emits a BackendSignerSet event
    /// @dev Does not check for authorization
    function _setBackendSigner(address _backendSigner) private {
        backendSigner = _backendSigner;
        emit BackendSignerSet(_backendSigner);
    }

    /// @notice Validates whether a nonce was already used and marks it as used
    /// @param nonce The nonce to validate
    /// @dev Reverts with NonceAlreadyUsed if the nonce was already used
    function _consumeNonce(string memory nonce) private {
        if (nonces[nonce]) {
            revert NonceAlreadyUsed(nonce);
        }

        nonces[nonce] = true;
    }

    /// @dev ABI encodes the message and hashes it using keccak256
    /// @param message The message containing the player address, score, nonce
    /// @return bytes32
    function _hashMessage(
        ScoreMessage memory message
    ) private pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "ScoreMessage(address player,uint256 totalScore,uint256 highScore,uint256 crewScore,string nonce)"
                    ),
                    message.player,
                    message.totalScore,
                    message.highScore,
                    message.crewScore,
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
