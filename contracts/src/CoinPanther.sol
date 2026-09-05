// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title CoinPanther
/// @notice Native ERC20 for the PNTHR DGTL ecosystem ($PNTHR).
///         Ticker chosen to avoid collision: PNTHR is clear on Robinhood Chain
///         whereas LUCY already has a live Uniswap v4 pool off-chain.
contract CoinPanther is ERC20, ERC20Permit, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    constructor(
        address initialOwner
    ) ERC20("CoinPanther", "PNTHR") ERC20Permit("CoinPanther") Ownable(initialOwner) {
        _mint(initialOwner, MAX_SUPPLY);
    }

    /// @notice Owner-minted emissions (rewards, gas-sponsor refunds, incentives).
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "cap exceeded");
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}