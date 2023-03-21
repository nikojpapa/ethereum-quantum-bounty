// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Address.sol";


contract SignatureBounty {
    using ECDSA for bytes32;

    uint256 public bounty;
    address [10] public locks;
    bool public solved;

    constructor(address[10] memory publicKeys) {
        locks = publicKeys;
    }

    modifier requireUnsolved() {
        require(!solved, 'Already solved');
        _;
    }

    function widthdraw(bytes32 message, bytes[10] memory signatures) public requireUnsolved {
        _assertSignaturesMatchLocks(message, signatures);
        solved = true;
        _sendBountyToSolver();
    }

    function _assertSignaturesMatchLocks(bytes32 message, bytes[10] memory signatures) private view {
        for (uint8 i = 0; i < locks.length; i++) {
            address lock = locks[i];
            bytes memory signature = signatures[i];
            require(_getSignerAddress(message, signature) == lock, 'Invalid signatures');
        }
    }

    function _getSignerAddress(bytes32 message, bytes memory signature) pure private returns (address) {
        return message
            .toEthSignedMessageHash()
            .recover(signature);
    }

    function _sendBountyToSolver() private {
        uint256 winnings = bounty;
        bounty = 0;
        Address.sendValue(payable(msg.sender), winnings);
    }

    function addToBounty() public payable requireUnsolved {
        bounty += msg.value;
    }

    receive() external payable {
        addToBounty();
    }

    fallback() external payable {
        addToBounty();
    }
}
