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
contract PepenadeCrushV2Test is
    Initializable,
    UUPSUpgradeable,
    EIP712Upgradeable,
    Ownable2StepUpgradeable
{
    /// @notice The address of the backend wallet that will sign the messages
    address public backendSigner;

    /// @notice Mapping of player address to their high score
    mapping(address => uint256) public highScore;

    /// @notice Mapping of nonces to check if they were already used
    mapping(string => bool) public nonces;

    /// @notice The version of the contract
    string public version = "2.0.0";

    /// @notice Sets the high score for a player
    /// @param player The player address
    /// @param score The score to set
    function addScore(
        address player,
        uint256 score
    ) external {
        highScore[player] += score;
    }

    /// @dev Upgrades the contract to a new implementation
    /// @param newImplementation The address of the new implementation
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
