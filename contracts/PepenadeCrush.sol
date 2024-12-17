// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title Fear & Greed: Pepenade Crush
/// @notice TODO
contract PepenadeCrush is
    Initializable,
    UUPSUpgradeable,
    EIP712Upgradeable,
    Ownable2StepUpgradeable
{
    /// @notice The address of the backend wallet that will sign the messages
    address public backendSigner;

    /// @notice The message struct containing the player address, score and nonce
    struct ScoreMessage {
        address player;
        uint256 score;
        string nonce;
    }

    /// @notice Event emitted when player's high score reaches a milestone
    event MilestoneReached(
        address player,
        uint256 milestoneIndex,
        uint256 highScore
    );

    /// @notice Event emitted when the backend wallet address is set
    event BackendSignerSet(address backendSigner);

    /// @dev Custom errors
    error NonceAlreadyUsed(string nonce);
    error InvalidSigner();
    error ScoreBelowThreshold(uint score, uint threshold);

    /// @notice Mapping of player address to their high score
    mapping(address => uint256) public highScore;

    /// @notice Mapping of player address to their high score milestones
    mapping(address => uint256) public reachedMilestoneIndex;

    /// @notice Mapping of nonce to a boolean indicating if it was already used
    mapping(string => bool) public nonces;

    /// @notice Initializes the contract with the backend wallet address and the deployer as the owner
    /// @param _backendSigner The address of the backend wallet
    function initialize(address _backendSigner) external initializer {
        __Ownable_init(msg.sender);
        __EIP712_init("PepenadeCrush", "1");
        setBackendSigner(_backendSigner);
    }

    /// @notice Adds a score to a player's current score
    /// @param message The message containing the player address, score and nonce
    /// @param signature The signature of the message signed by the backend wallet
    function setHighScore(
        ScoreMessage memory message,
        bytes memory signature
    ) external {
        if (_nonceUsed(message.nonce)) {
            revert NonceAlreadyUsed(message.nonce);
        }

        if (!_verifySignature(message, signature)) {
            revert InvalidSigner();
        }

        // Mark the nonce as used
        nonces[message.nonce] = true;

        uint256 newScore = message.score;
        uint256 nextMilestone = getNextMilestone(message.player);

        // Prevent player from setting a score lower than the next milestone
        if (newScore < nextMilestone) {
            revert ScoreBelowThreshold(newScore, nextMilestone);
        }

        // Player can beat multiple milestones in one go, so we keep checking the next milestone until it's higher than the new score
        while (newScore >= nextMilestone) {
            reachedMilestoneIndex[message.player]++;
            nextMilestone = getNextMilestone(message.player);

            emit MilestoneReached(
                message.player,
                reachedMilestoneIndex[message.player],
                newScore
            );
        }

        // Update the player's high score
        highScore[message.player] = newScore;
    }

    /// @notice Calculates the next milestone for a player
    /// @dev The milestones are calculated as Fibonacci numbers, starting from 10
    /// @param player The player address
    /// @return uint256
    function getNextMilestone(address player) public view returns (uint256) {
        uint256 nextMilestoneIndex = reachedMilestoneIndex[player] + 1;
        return getMilestoneScore(nextMilestoneIndex);
    }

    /// @notice Calculates the score for a given milestone
    /// @dev The milestones are calculated as Fibonacci numbers, starting from 10
    /// @param milestoneIndex The 1-based index of the milestone. The first milestone to beat has index 1
    /// @return uint256
    function getMilestoneScore(uint256 milestoneIndex) public pure returns (uint256) {
        if (milestoneIndex == 0) {
            return 0;
        }
        if (milestoneIndex == 1) {
            return 10;
        }

        uint256 a = 10;
        uint256 b = 20;
        for (uint256 i = 2; i < milestoneIndex; i++) {
            uint256 c = a + b;
            a = b;
            b = c;
        }

        return b;
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
    function setBackendSigner(address _backendSigner) public onlyOwner {
        backendSigner = _backendSigner;
        emit BackendSignerSet(_backendSigner);
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
        ScoreMessage memory message,
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

    /// @dev Upgrades the contract to a new implementation
    /// @param newImplementation The address of the new implementation
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
