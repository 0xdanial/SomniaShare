// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";

/**
 * @title MetaTransactionHelper
 * @dev Helper contract to demonstrate meta-transaction usage
 * This is for reference and testing purposes
 */
contract MetaTransactionHelper {
    ERC2771Forwarder public immutable forwarder;
    
    constructor(address _forwarder) {
        forwarder = ERC2771Forwarder(_forwarder);
    }
    
    /**
     * @dev Example of how to create a meta-transaction request
     * This would typically be called from a frontend application
     */
    function createMetaTransactionRequest(
        address target,
        uint256 value,
        bytes calldata data,
        uint48 deadline
    ) external view returns (ERC2771Forwarder.ForwardRequestData memory) {
        return ERC2771Forwarder.ForwardRequestData({
            from: msg.sender,
            to: target,
            value: value,
            gas: 1000000, // Adjust gas limit as needed
            deadline: deadline,
            data: data,
            signature: "" // Empty signature, will be filled by the caller
        });
    }
}
