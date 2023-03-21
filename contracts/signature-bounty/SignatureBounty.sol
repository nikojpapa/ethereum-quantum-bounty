// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract SignatureBounty {
    using ECDSA for bytes32;

    address [3] public locks;
    bool public solved;

    constructor(address[3] memory publicKeys) {
        locks = publicKeys;
    }

    modifier requireUnsolved() {
        require(!solved, 'Already solved');
        _;
    }

    function widthdraw(bytes32 message, bytes[3] memory signatures) public requireUnsolved {
        _assertSignaturesMatchLocks(message, signatures);
        solved = true;
        _sendBountyToSolver();
    }

    function _assertSignaturesMatchLocks(bytes32 message, bytes[3] memory signatures) private view {
        for (uint8 i = 0; i < locks.length; i++) {
            address lock = locks[i];
            bytes memory signature = signatures[i];
            require(_getSignerAddress(message, signature) == lock, 'Invalid signatures');
        }
    }

    function _getSignerAddress(bytes32 message, bytes memory signature) private pure returns (address) {
        return message
            .toEthSignedMessageHash()
            .recover(signature);
    }

    function _sendBountyToSolver() private {
        Address.sendValue(payable(msg.sender), bounty());
    }

    function bounty() public view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {
        addToBounty();
    }

    fallback() external payable {
        addToBounty();
    }

    function addToBounty() public payable requireUnsolved {
    }
}
