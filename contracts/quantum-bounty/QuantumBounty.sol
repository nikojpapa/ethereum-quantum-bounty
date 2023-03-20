// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";


contract QuantumBounty {
    using ECDSA for bytes32;

    uint256 public bounty;
    address [10] public locks;
    bool public solved;

    constructor(address[10] memory publicKeys) {
        locks = publicKeys;
    }

    function addToBounty() public payable {
        require(!solved, 'Already solved');
        bounty += msg.value;
    }

    receive() external payable {
        addToBounty();
    }

    fallback() external payable {
        addToBounty();
    }

    function widthdraw(bytes32 message, bytes[10] memory signatures) public {
        _assertSignaturesMatchLocks(message, signatures);
        solved = true;
        _sendBountyToSolver();
    }

    function _assertSignaturesMatchLocks(bytes32 message, bytes[10] memory signatures) private {
        for (uint8 i = 0; i < locks.length; i++) {
            address lock = locks[i];
            bytes memory signature = signatures[i];
            require(_getSignerAddress(message, signature) == lock, 'Invalid signatures');
        }
    }

    function _getSignerAddress(bytes32 message, bytes memory signature) private returns (address) {
        return message
            .toEthSignedMessageHash()
            .recover(signature);
    }

    function _sendBountyToSolver() private {
        uint256 winnings = bounty;
        bounty = 0;
        msg.sender.call{value: winnings}("");
    }
}
