// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title HighScore contract for upgrade testing purposes
/// @notice UUPS upgradable contract, used to store the high score for Pepenade Crush game by utilizing EIP-712 standard
contract HighScoreV2Test is
    Initializable,
    UUPSUpgradeable,
    EIP712Upgradeable,
    Ownable2StepUpgradeable
{
    /// @notice The address of the backend wallet that will sign the messages
    address public backendSigner;

    string public version = "2.0.0";

    /// @notice The message struct containing the player address, score and nonce
    struct HighScoreMessage {
        address player;
        uint256 score;
        string nonce;
    }

    /// @notice Event emitted when a high score is set
    event HighScoreSet(address player, uint256 currentScore, uint256 newScore);

    /// @dev Custom errors
    error NonceAlreadyUsed(string nonce);
    error InvalidSigner();
    error ScoreNotHigher(uint currentScore, uint newScore);

    /// @notice Mapping of player address to their high score
    mapping(address => uint256) public highScores;

    /// @notice Mapping of nonces to check if they were already used
    mapping(string => bool) public nonces;

    /// @notice Sets the high score for a player
    /// @param player The player address
    /// @param score The score to set
    function setHighScore(
        address player,
        uint256 score
    ) external {
        highScores[player] = score;
    }

    /// @dev Upgrades the contract to a new implementation
    /// @param newImplementation The address of the new implementation
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
