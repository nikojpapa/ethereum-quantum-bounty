// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../samples/SimpleAccount.sol";

contract BountyFallbackAccount is SimpleAccount {
    using ECDSA for bytes32;
    bytes[][] lamportKey;
    uint256 numberOfTests;
    uint256 testSizeInBytes;

    constructor(IEntryPoint anEntryPoint) SimpleAccount(anEntryPoint) {
    }

    function initialize(address anOwner, bytes[][] memory publicKey) public initializer {
        lamportKey = publicKey;
        numberOfTests = publicKey[0].length;
        testSizeInBytes = publicKey[0][0].length;

        SimpleAccount.initialize(anOwner);
    }

    function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash)
    internal override returns (uint256 validationData) {
        bytes[] memory signatureBytes = new bytes[](testSizeInBytes);
        for (uint8 i = 0; i < numberOfTests; i++) {
            signatureBytes[i] = BytesLib.slice(userOp.signature, testSizeInBytes * i, testSizeInBytes);
        }

        bytes[] memory checks = new bytes[](testSizeInBytes);
        for (uint8 i = 0; i < numberOfTests; i++) {
            bytes memory signatureByte = signatureBytes[i];
            bytes32 valueToTest = keccak256(signatureByte);
            bytes memory valueToTestInBytesFromBytes32 = abi.encodePacked(valueToTest);
            checks[i] = BytesLib.slice(valueToTestInBytesFromBytes32, 0, testSizeInBytes);
        }

        bytes32 hash = userOpHash.toEthSignedMessageHash();
        uint256 hashInt = uint256(hash);
        uint256 mask = uint256(~(-1 << numberOfTests));
        uint256 bits = hashInt & mask;
        for (uint8 i = 0; i < numberOfTests; i++) {
            uint256 b = (bits >> i) & 1;
            bytes memory check = checks[i];
            require(BytesLib.equal(lamportKey[b][i], check), 'Invalid signature');
//            return SIG_VALIDATION_FAILED;
        }

        return 0;
    }
}
