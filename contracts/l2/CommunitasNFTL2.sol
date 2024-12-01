// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ArbSys} from "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import {AddressAliasHelper} from "@arbitrum/nitro-contracts/src/libraries/AddressAliasHelper.sol";
import {CommunitasNFT} from "../CommunitasNFT.sol";

contract CommunitasNFTL2 is CommunitasNFT {

    ArbSys constant arbsys = ArbSys(address(100));
    address public l1Target;

    event L2ToL1TxCreated(uint256 indexed withdrawalId);

    constructor(
        address _l1Target
    ) CommunitasNFT() {
        l1Target = _l1Target;
    }

    function updatel1Target(address _l1Target) public onlyOwner {
        l1Target = _l1Target;
    }

    function bridgeToL1(uint256 tokenId) public returns (uint256) {

        require(_ownerOf(tokenId) == msg.sender, "NFT not owned by sender");
        _burn(tokenId);

        bytes memory data = abi.encodeWithSelector(CommunitasNFT.mintFromBridge.selector, msg.sender, tokenId);

        uint256 withdrawalId = arbsys.sendTxToL1(l1Target, data);

        emit L2ToL1TxCreated(withdrawalId);
        return withdrawalId;
    }

    /// @notice only l1Target can mint NFT
    function mintFromBridge(address receiver, uint256 tokenId) public override {
        // To check that message came from L1, we check that the sender is the L1 contract's L2 alias.
        require(
            msg.sender == AddressAliasHelper.applyL1ToL2Alias(l1Target),
            "NFT only mintable by L1"
        );
        _mint(receiver, tokenId);
        tokenCounter = tokenId + 1;
    }

}
