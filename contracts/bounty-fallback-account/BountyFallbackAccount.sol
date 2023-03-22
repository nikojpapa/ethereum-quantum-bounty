// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../samples/SimpleAccount.sol";

contract BountyFallbackAccount is SimpleAccount {
    using ECDSA for bytes32;
    uint256[][] lamportKey;


    uint8 numberOfTests = 8;
    uint8 numberSizeBytes = 4;
    uint8 BITS_PER_BYTE = 8;

    constructor(IEntryPoint anEntryPoint) SimpleAccount(anEntryPoint) {
    }

    function initialize(address anOwner, uint256[][] memory publicKey) public initializer {
        lamportKey = publicKey;
        SimpleAccount.initialize(anOwner);
    }

    function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash)
    internal override returns (uint256 validationData) {
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        uint256 hashInt = uint256(hash);

        uint256[8] memory checks;
        for (uint8 i = 0; i < 8; i++) {
            signature_test_value = userOp.signature[2 + numberSizeBytes * i:numberSizeBytes];
            checks[i] = keccak256(signature)[2:numberSizeBytes];
        }

        for (uint8 i = 0; i < 8; i++) {
            uint256 b = (hashInt >> i) & 1;
            uint256 check = signature[i];
            require(lamportKey[b][i] == check, 'Invalid signature');
        }

//        uint256[8] memory signature;
//        for (uint8 i = 0; i < numberOfTests; i++) {
//            require(false, 'pick eggs 3');
//            signature[i] = BytesLib.toUint32(userOp.signature, (numberSizeBytes * BITS_PER_BYTE) * i);
//        }
//
//        for (uint8 j = 0; j < numberOfTests; j++) {
//            require(false, 'pick eggs 2');
//            uint256 b = (hashInt >> j) & 1;
//            require(lamportKey[b][j] != signature[j], 'pick eggs');
//            uint256 check = signature[j];
//            if (lamportKey[b][j] != check) {
//                return SIG_VALIDATION_FAILED;
//            }
//        }
    }
}
