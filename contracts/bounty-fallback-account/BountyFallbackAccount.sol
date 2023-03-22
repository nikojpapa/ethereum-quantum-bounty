// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../samples/SimpleAccount.sol";

contract BountyFallbackAccount is SimpleAccount {
    using ECDSA for bytes32;
    uint256[][] lamportKey;

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

        uint256[256] memory signature;
        for (uint8 i = 0; i < 256; i++) {
            signature[i] = BytesLib.toUint256(userOp.signature, 0);
        }

        for (uint8 i = 0; i < 256; i++) {
            uint256 b = (hashInt >> i) & 1;
            uint256 check = signature[i];
            if (lamportKey[b][i] != check) {
                return SIG_VALIDATION_FAILED;
            }
        }

        return 0;
    }
}
