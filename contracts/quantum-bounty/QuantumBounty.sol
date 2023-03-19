// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable reason-string */

import "../interfaces/IEntryPoint.sol";


contract QuantumBounty {
    uint256 public bounty;

    constructor() {
        bounty = 0;
    }

    function addToBounty() public payable {
        bounty += msg.value;
    }

    receive() external payable {
        addToBounty();
    }

    fallback() external payable {
        addToBounty();
    }

//    /**
//     * withdraw value from the deposit
//     * @param withdrawAddress target to send to
//     * @param amount to withdraw
//     */
//    function withdrawTo(address payable withdrawAddress, uint256 amount) public onlyOwner {
//        entryPoint.withdrawTo(withdrawAddress, amount);
//    }
}
