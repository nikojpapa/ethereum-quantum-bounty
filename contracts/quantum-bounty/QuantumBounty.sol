// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";


contract QuantumBounty {
    using ECDSA for bytes32;

    uint256 public bounty;
    address [10] public locks;

    constructor(address[10] memory publicKeys) {
        bounty = 0;
        locks = publicKeys;
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

    function widthdraw(bytes32 message, bytes[10] memory signatures) public {
        bool signaturesConfirmed = true;
        for (uint8 i = 0; i < locks.length; i++) {
            address lock = locks[i];
            bytes memory signature = signatures[i];

            bool success = message
                .toEthSignedMessageHash()
                .recover(signature) == lock;

            if (!success) {
                signaturesConfirmed = false;
                break;
            }
        }

        require(signaturesConfirmed, 'Invalid signatures');

        uint256 winnings = bounty;
        bounty = 0;
        payable(msg.sender).call{value: winnings}("");
    }
}
