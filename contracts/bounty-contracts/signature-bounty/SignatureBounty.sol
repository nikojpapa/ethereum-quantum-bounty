// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../BountyContract.sol";

contract SignatureBounty is BountyContract {
    using ECDSA for bytes32;

    constructor(bytes[] memory publicKeys)
      BountyContract(publicKeys.length)
    {
      for (uint256 lockNumber = 0; lockNumber < publicKeys.length; lockNumber++) {
        locks[lockNumber] = publicKeys[lockNumber];
      }
      SANITY_CHECK_LOCK_VALUE = hex'f39fd6e51aad88f6f4ce6ab8827279cfffb92266';
      SANITY_CHECK_LOCK_SOLUTION = [
        abi.encodePacked(hex'a7676d405149db0e277add4acf58926aa509e86537459556795751544f77b173'),
        abi.encodePacked(hex'9613be127d58ea46115913ca63e3e3962be783cd02331903d42218ccdaeb05ec1ac70086e44c2b02fe552195154371bf721cb55c1caa93a0fa5403b5891b0cea1b')
      ];
    }

    function _verifySolution(uint256 lockNumber, bytes[] memory solution) internal view override returns (bool) {
      address lock = BytesLib.toAddress(getLockValue(lockNumber), 0);
      bytes32 message = BytesLib.toBytes32(solution[0], 0);
      bytes memory signature = solution[1];
      return _getSignerAddress(message, signature) == lock;
    }

    function _getSignerAddress(bytes32 message, bytes memory signature) private pure returns (address) {
      return message
        .toEthSignedMessageHash()
        .recover(signature);
    }
}
