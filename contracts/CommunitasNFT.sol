// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


abstract contract CommunitasNFT is ERC721, Ownable {

    string constant BASE_URI = "https://wattswap.vercel.app/_next/image?url=%2Fcommunitas.png&w=256&q=75";

    uint256 public tokenCounter;

    constructor() ERC721("CommunitasNFT", "CNFT") Ownable(msg.sender) {}

    function mint() public returns (uint256){ // todo: remove this
        uint256 tokenId = tokenCounter;
        _mint(msg.sender, tokenId);
        tokenCounter++;
        return tokenId;
    }

    function mintFromBridge(address receiver, uint256 tokenId) public virtual;

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        string memory baseURI = _baseURI();
        return baseURI; //bytes(baseURI).length > 0 ? string.concat(baseURI, tokenId.toString()) : "";
    }

    /**
     * @dev Base URI for computing {tokenURI}.
     */
    function _baseURI() internal pure override returns (string memory) {
        return BASE_URI;
    }

}
