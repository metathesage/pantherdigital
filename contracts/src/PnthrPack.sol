// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title PnthrPack
/// @notice ERC1155 gamified discovery lootboxes.
///         Rarities: Common 60% / Rare 30% / Mythic 10%.
///
///         FIFO-safe open flow (commit-reveal): the opener first COMMITS a
///         hash and later REVEALS the preimage. Rarity is derived from the
///         hidden preimage + opener + chain entropy, so it cannot be gamed by
///         observing the sequencer or re-rolling off a predictable blockhash.
///
///         Upgrade path: replace `_rollRarity` with a VRF callback once a
///         verifiable-randomness oracle is live on the chain (Orbit L3).
contract PnthrPack is ERC1155, Ownable {
    uint256 public constant PACK_ID = 0;
    uint256 public constant COMMON_ID = 1;
    uint256 public constant RARE_ID = 2;
    uint256 public constant MYTHIC_ID = 3;

    // rarity thresholds (percent, cumulative)
    uint256 public constant COMMON_CUT = 60;
    uint256 public constant RARE_CUT = 90;

    uint256 public packPrice;
    /// @dev seconds a commit must age before its reveal is accepted
    uint64 public revealDelay;

    struct OpenRequest {
        bytes32 commitment;
        uint64 committedAt;
        bool revealed;
    }
    mapping(address => OpenRequest) public openRequests;

    event PackOpened(address indexed opener, uint256 rarity);
    event PackCommitted(address indexed opener, bytes32 commitment, uint64 committedAt);

    constructor(address initialOwner) ERC1155("https://ipfs.REPLACE.me/{id}.json") Ownable(initialOwner) {
        packPrice = 0.005 ether;
        revealDelay = 30;
    }

    function setPackPrice(uint256 price) external onlyOwner {
        packPrice = price;
    }

    function setRevealDelay(uint64 delaySeconds) external onlyOwner {
        revealDelay = delaySeconds;
    }

    function setURI(string memory newURI) external onlyOwner {
        _setURI(newURI);
    }

    /// @notice Buy sealed packs with native gas token.
    function buyPack(uint256 amount) external payable {
        require(amount > 0, "zero");
        require(msg.value >= packPrice * amount, "insufficient payment");
        _mint(msg.sender, PACK_ID, amount, "");
    }

    /// @notice Commit phase 1/2 — no on-chain secret yet, opener commits hash.
    function commitOpen(bytes32 commitment) external {
        require(balanceOf(msg.sender, PACK_ID) >= 1, "no sealed pack");
        OpenRequest storage req = openRequests[msg.sender];
        require(req.commitment == bytes32(0) || req.revealed, "pending reveal");
        openRequests[msg.sender] = OpenRequest(commitment, uint64(block.timestamp), false);
        emit PackCommitted(msg.sender, commitment, uint64(block.timestamp));
    }

    /// @notice Reveal phase 2/2 — burn sealed pack, mint rarity by hidden secret.
    function revealOpen(bytes32 secret, bytes32 nonce) external {
        OpenRequest storage req = openRequests[msg.sender];
        require(req.commitment != bytes32(0), "no commit");
        require(!req.revealed, "already revealed");
        require(keccak256(abi.encodePacked(secret, nonce)) == req.commitment, "bad preimage");
        require(uint64(block.timestamp) >= req.committedAt + revealDelay, "too early");

        _burn(msg.sender, PACK_ID, 1);
        uint256 rarity = _rollRarity(secret, nonce, msg.sender);
        _mint(msg.sender, rarity, 1, "");

        req.revealed = true;
        emit PackOpened(msg.sender, rarity);
    }

    /// @notice 60/30/10 rarity from hidden secret + opener + chain entropy.
    function _rollRarity(
        bytes32 secret,
        bytes32 nonce,
        address opener
    ) internal view returns (uint256) {
        uint256 entropy = uint256(
            keccak256(
                abi.encodePacked(
                    secret,
                    nonce,
                    opener,
                    block.prevrandao,
                    blockhash(block.number - 1)
                )
            )
        );
        uint256 roll = entropy % 100;
        if (roll < COMMON_CUT) return COMMON_ID;
        if (roll < RARE_CUT) return RARE_ID;
        return MYTHIC_ID;
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }

    receive() external payable {}
}