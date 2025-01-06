// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title Fear & Greed: Pepenade Crush
/// @notice TODO
contract PepenadeCrush is
    Initializable,
    UUPSUpgradeable,
    EIP712Upgradeable,
    OwnableUpgradeable
{
    /// @notice The address of the backend wallet that will sign the messages
    address public backendSigner;

    /// @notice The message struct containing the player address, score and nonce
    struct ScoreMessage {
        address player;
        uint256 score;
        string nonce;
    }

    /// @notice The message struct containing the player address, score and nonce for crew owners
    struct CrewScoreMessage {
        address player;
        uint256 score;
        string nonce;
    }

    /// @notice Event emitted when player's reaches new high score
    event NewHighScore(address indexed player, uint256 highScore, bool isCrew);

    /// @notice Event emitted when the backend wallet address is set
    event BackendSignerSet(address backendSigner);

    /// @dev Custom errors
    error NonceAlreadyUsed(string nonce);
    error InvalidSigner();
    error ScoreLowerOrEqualCurrentHighScore(
        uint256 score,
        uint256 currentHighscore
    );

    /// @notice Mapping of player address to their high score
    mapping(address => uint256) public highScore;

    /// @notice Mapping of crew address to their high score
    mapping(address => uint256) public crewHighScore;

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
    function setHighScore(
        ScoreMessage memory message,
        bytes memory signature
    ) external {
        _verifySignature(message, signature);
        _setHighScore(message.player, message.score, message.nonce, false);
    }

    function setCrewHighScore(
        CrewScoreMessage memory message,
        bytes memory signature
    ) external {
        _verifyCrewSignature(message, signature);
        _setHighScore(message.player, message.score, message.nonce, true);
    }

    function _setHighScore(
        address player,
        uint256 score,
        string memory nonce,
        bool isCrew
    ) private {
        _consumeNonce(nonce);

        mapping(address => uint256) storage scoreMapping = isCrew
            ? crewHighScore
            : highScore;

        uint256 currentHighscore = scoreMapping[player];

        if (score <= currentHighscore)
            revert ScoreLowerOrEqualCurrentHighScore(score, currentHighscore);

        // Update the player's high score
        scoreMapping[player] = score;

        // Emit event
        emit NewHighScore(player, score, isCrew);
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

    /// @dev Verifies if the message of was constructed correctly
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

    function _verifyCrewSignature(
        CrewScoreMessage memory message,
        bytes memory signature
    ) private view {
        bytes32 digest = _hashTypedDataV4(_hashCrewMessage(message));
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
                        "ScoreMessage(address player,uint256 score,string nonce)"
                    ),
                    message.player,
                    message.score,
                    keccak256(bytes(message.nonce))
                )
            );
    }

    /// @dev ABI encodes the message and hashes it using keccak256
    /// @param message The message containing the player address, score, nonce
    /// @return bytes32
    function _hashCrewMessage(
        CrewScoreMessage memory message
    ) private pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "CrewScoreMessage(address player,uint256 score,string nonce)"
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
