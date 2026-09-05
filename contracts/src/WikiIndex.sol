// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title WikiIndex
/// @notice Tiny decentralized wiki index. Stores (title -> contentHash ->
///         author -> timestamp) entries so third-party renderers can resolve
///         lore/realm pages from an immutable on-chain pointer.
contract WikiIndex is Ownable {
    struct Entry {
        string title;
        string contentHash; // ipfs:// CID or similar
        address author;
        uint256 updatedAt;
    }

    Entry[] public entries;
    mapping(string => uint256) private _indexOf; // title -> 1-based index
    mapping(string => bool) public exists;

    event EntryUpserted(string indexed title, string contentHash, address indexed author, uint256 updatedAt);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function upsert(string calldata title, string calldata contentHash) external returns (uint256 index) {
        require(bytes(title).length > 0, "empty title");
        uint256 i = _indexOf[title];
        if (i == 0) {
            entries.push(Entry(title, contentHash, msg.sender, block.timestamp));
            index = entries.length - 1;
            _indexOf[title] = index + 1;
            exists[title] = true;
        } else {
            index = i - 1;
            Entry storage e = entries[index];
            e.contentHash = contentHash;
            e.author = msg.sender;
            e.updatedAt = block.timestamp;
        }
        emit EntryUpserted(title, contentHash, msg.sender, block.timestamp);
    }

    function getEntry(string calldata title) external view returns (Entry memory) {
        uint256 i = _indexOf[title];
        require(i != 0, "not found");
        return entries[i - 1];
    }

    function totalEntries() external view returns (uint256) {
        return entries.length;
    }
}