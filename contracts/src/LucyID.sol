// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title LucyID
/// @notice Soulbound ERC721 passport. Tracks on-chain activity (packs opened,
///         realm visits, prediction/signal accuracy) that accrues over time.
///         Transfers are blocked so the identity can never leave the holder.
contract LucyID is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    error Soulbound();
    error NotMinted();

    // On-chain passport counters (soulbound — writable only by owner/passport logic)
    mapping(uint256 => uint256) public packsOpened;
    mapping(uint256 => uint256) public realmVisits;
    /// @dev accuracy in basis points (0–10000)
    mapping(uint256 => uint256) public predictionAccuracy;

    constructor(address initialOwner) ERC721("LucyID", "LUCY") Ownable(initialOwner) {}

    function safeMint(address to, string memory uri) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function hasPassport(address account) external view returns (bool) {
        return balanceOf(account) > 0;
    }

    function recordPackOpen(uint256 tokenId) external onlyOwner {
        if (_ownerOf(tokenId) == address(0)) revert NotMinted();
        packsOpened[tokenId] += 1;
    }

    function recordRealmVisit(uint256 tokenId) external onlyOwner {
        if (_ownerOf(tokenId) == address(0)) revert NotMinted();
        realmVisits[tokenId] += 1;
    }

    function recordPrediction(uint256 tokenId, bool correct) external onlyOwner {
        if (_ownerOf(tokenId) == address(0)) revert NotMinted();
        uint256 a = predictionAccuracy[tokenId];
        if (a == 0) {
            predictionAccuracy[tokenId] = correct ? 10_000 : 0;
        } else {
            // exponential-ish moving average toward the new sample
            predictionAccuracy[tokenId] = a + (correct ? 10_000 : 0) - (a / 2);
            predictionAccuracy[tokenId] = (predictionAccuracy[tokenId] + a) / 2;
        }
    }

    /// @dev Soulbound: block any transfer once minted (mint-to-zero only).
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}