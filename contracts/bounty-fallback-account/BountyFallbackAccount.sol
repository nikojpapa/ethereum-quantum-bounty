// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "../samples/SimpleAccount.sol";

contract BountyFallbackAccount is SimpleAccount {
    using ECDSA for bytes32;

    constructor(IEntryPoint anEntryPoint) SimpleAccount(anEntryPoint) {
    }

    function initialize(address anOwner) public override initializer {
        SimpleAccount.initialize(anOwner);
    }

    /// implement template method of BaseAccount
    function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash)
    internal override returns (uint256 validationData) {
        require(false, 'false');
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        if (owner != hash.recover(userOp.signature))
            return SIG_VALIDATION_FAILED;
        return 0;
    }
}

