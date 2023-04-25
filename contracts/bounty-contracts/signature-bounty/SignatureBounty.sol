// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../BountyContract.sol";

contract SignatureBounty is BountyContract {
    using ECDSA for bytes32;

    constructor(bytes[] memory publicKeys) {
        locks = new bytes[](publicKeys.length);
        for (uint256 lockNumber = 0; lockNumber < publicKeys.length; lockNumber++) {
            locks[lockNumber] = publicKeys[lockNumber];
        }
    }

    function _verifySolutions(bytes[][] memory solutions) internal view override returns (bool) {
        for (uint256 i = 0; i < locks.length; i++) {
            address lock = BytesLib.toAddress(locks[i], 0);
            bytes[] memory lockSolutions = solutions[i];
            bytes32 message = BytesLib.toBytes32(lockSolutions[0], 0);
            bytes memory signature = lockSolutions[1];
            if (_getSignerAddress(message, signature) != lock) return false;
        }
        return true;
    }

    function _getSignerAddress(bytes32 message, bytes memory signature) private pure returns (address) {
        return message
            .toEthSignedMessageHash()
            .recover(signature);
    }
}
