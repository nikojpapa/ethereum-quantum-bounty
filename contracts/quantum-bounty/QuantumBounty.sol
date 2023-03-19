// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

contract QuantumBounty {
    uint256 public bounty;
    address[] public locks;

    constructor(address[] memory locksToSet) {
        bounty = 0;
        locks = locksToSet;
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
