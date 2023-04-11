// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../samples/SimpleAccount.sol";
import "../signature-bounty/SignatureBounty.sol";

contract BountyFallbackAccount is SimpleAccount {
    using ECDSA for bytes32;

    SignatureBounty private bountyContract;
    bytes[][] private lamportKey;
    uint256 private numberOfTests;
    uint256 private testSizeInBytes;
    uint16 private ecdsaLength;

    constructor(IEntryPoint anEntryPoint) SimpleAccount(anEntryPoint) {
    }

    function initialize(address anOwner, bytes[][] memory publicKey, address payable bountyContractAddress) public initializer {
        bountyContract = SignatureBounty(bountyContractAddress);

        lamportKey = publicKey;
        numberOfTests = publicKey[0].length;
        testSizeInBytes = publicKey[0][0].length;

        ecdsaLength = 65;

        SimpleAccount.initialize(anOwner);
    }

    function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash)
    internal override returns (uint256 validationData) {
        bytes32 userOpHashEthSigned = userOpHash.toEthSignedMessageHash();

        bytes memory ecdsaSignature = BytesLib.slice(userOp.signature, 0, ecdsaLength);
        if (owner != userOpHashEthSigned.recover(ecdsaSignature))
            return SIG_VALIDATION_FAILED;

        if (bountyContract.solved()) {
            bytes[] memory checks = new bytes[](testSizeInBytes);
            for (uint256 i = 0; i < numberOfTests; i++) {
                bytes memory signatureByte = BytesLib.slice(userOp.signature, ecdsaLength + testSizeInBytes * i, testSizeInBytes);
                bytes32 valueToTest = keccak256(signatureByte);
                checks[i] = BytesLib.slice(_bytes32ToBytes(valueToTest), 0, testSizeInBytes);
            }

            uint256 hashInt = uint256(userOpHashEthSigned);
            for (uint256 i = 0; i < numberOfTests; i++) {
                uint256 b = (hashInt >> i) & 1;
                bytes memory check = checks[i];
                if (!BytesLib.equal(lamportKey[b][i], check))
                    return SIG_VALIDATION_FAILED;
    //            require(BytesLib.equal(lamportKey[b][i], check), 'Invalid signature');
            }
        }

        _updateLamportKeys(userOp.signature);

        return 0;
    }

    function _bytes32ToBytes(bytes32 bytesFrom) private pure returns (bytes memory) {
        return abi.encodePacked(bytesFrom);
    }

    function _updateLamportKeys(bytes memory signature) private {
        uint256 startOfNewKey = ecdsaLength + testSizeInBytes * testSizeInBytes;
        for (uint256 j = 0; j < 2; j++) {
            for (uint256 i = 0; i < numberOfTests; i++) {
                bytes memory signatureByte = BytesLib.slice(signature, startOfNewKey + testSizeInBytes * i, testSizeInBytes);
                lamportKey[j][i] = signatureByte;
            }
        }
    }
}
