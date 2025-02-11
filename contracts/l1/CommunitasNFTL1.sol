// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IBridge} from "@arbitrum/nitro-contracts/src/bridge/IBridge.sol";
import {IInbox} from "@arbitrum/nitro-contracts/src/bridge/IInbox.sol";
import {IOutbox} from "@arbitrum/nitro-contracts/src/bridge/IOutbox.sol";
import {CommunitasNFT} from "../CommunitasNFT.sol";

contract CommunitasNFTL1 is CommunitasNFT {

    address public l2Target;
    IInbox public inbox;

    event RetryableTicketCreated(uint256 indexed ticketId);

    constructor(
        address _l2Target,
        address _inbox
    ) CommunitasNFT() {
        l2Target = _l2Target;
        inbox = IInbox(_inbox);
    }

    function updatel2Target(address _l2Target) public onlyOwner {
        l2Target = _l2Target;
    }

    function bridgeToL2(uint256 tokenId,
        uint256 maxSubmissionCost,
        uint256 maxGas,
        uint256 gasPriceBid
    ) public payable returns (uint256) {
        require(_ownerOf(tokenId) == msg.sender, "NFT not owned by sender");
        _burn(tokenId);

        bytes memory data = abi.encodeWithSelector(CommunitasNFT.mintFromBridge.selector, msg.sender, tokenId);
        uint256 ticketID = inbox.createRetryableTicket{ value: msg.value }(
            l2Target,
            0,
            maxSubmissionCost,
            msg.sender,
            msg.sender,
            maxGas,
            gasPriceBid,
            data
        );

        emit RetryableTicketCreated(ticketID);
        return ticketID;
    }

    /// @notice only l2Target can mint an NFT
    function mintFromBridge(address receiver, uint256 tokenId) public override {
        IBridge bridge = inbox.bridge();
        // this prevents reentrancies on L2 to L1 txs
        require(msg.sender == address(bridge), "NOT_BRIDGE");
        IOutbox outbox = IOutbox(bridge.activeOutbox());
        address l2Sender = outbox.l2ToL1Sender();
        require(l2Sender == l2Target, "Greeting only updateable by L2");

        _mint(receiver, tokenId);
    }
}
