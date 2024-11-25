// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

import "hardhat/console.sol";

/// @title HighScore contract
/// @notice This contract is used to store the high score for Pepenade Crush game by utilizing EIP-712 standard
contract HighScore {
    struct HighScoreMessage {
        address player;
        uint256 score;
        string nonce;
        bytes signature;
    }

    mapping(address => uint256) public highScores;
    mapping(string => bool) public nonces;

    /// @notice This function is used to set the high score for a player
    /// @param message The message containing the player address, score, nonce and signature
    function setHighScore(HighScoreMessage memory message) public {}
}
