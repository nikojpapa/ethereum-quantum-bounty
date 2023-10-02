// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../BountyContract.sol";
import "../LocksManager.sol";

contract SignatureBounty is BountyContract {
  using ECDSA for bytes32;

  constructor(bytes[][] memory publicKeys)
    BountyContract(publicKeys.length)
  {
    for (uint256 lockNumber = 0; lockNumber < publicKeys.length; lockNumber++) {
      LockManager.setLock(lockManager(), lockNumber, publicKeys[lockNumber]);
    }
  }

  function _verifySolution(uint256 lockNumber, bytes memory solution) internal view override returns (bool) {
    bytes[] memory solutionDecoded = abi.decode(solution, (bytes[]));
    address lock = BytesLib.toAddress(getLock(lockNumber)[0], 0);
    bytes32 message = BytesLib.toBytes32(solutionDecoded[0], 0);
    bytes memory signature = solutionDecoded[1];
    return _getSignerAddress(message, signature) == lock;
  }

  function _getSignerAddress(bytes32 message, bytes memory signature) private pure returns (address) {
    return message
      .toEthSignedMessageHash()
      .recover(signature);
  }
}
