// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SimpleNFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
<<<<<<< HEAD
    
    mapping(uint256 => uint256) private _tokenPrices;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mintNFT(address recipient, string memory tokenURI, uint256 price) public returns (uint256) {
=======

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mintNFT(address recipient, string memory tokenURI) public returns (uint256) {
>>>>>>> 014422cdbae7f63508c0aae01604fd6ad9109989
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
<<<<<<< HEAD
        _tokenPrices[newItemId] = price;
        return newItemId;
    }

    function getTokenPrice(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenPrices[tokenId];
    }

    function setTokenPrice(uint256 tokenId, uint256 newPrice) public {
        require(ownerOf(tokenId) == msg.sender, "Not the token owner");
        _tokenPrices[tokenId] = newPrice;
=======
        return newItemId;
>>>>>>> 014422cdbae7f63508c0aae01604fd6ad9109989
    }
}