// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../BountyContract.sol";
import "../BigNumbers.sol";

abstract contract OrderFindingBounty is BountyContract {
  using BigNumbers for *;

  constructor(uint256 numberOfLocks) BountyContract(numberOfLocks) {}

  function _verifySolution(uint256 lockNumber, bytes[] memory solution) internal view override returns (bool) {
    bytes[] memory lock = getLockValue(lockNumber);
    bytes memory modulus = lock[0];
    bytes memory base = lock[1];

    BigNumber memory answer = base.init(false).modexp(solution[0].init(false), modulus.init(false));
    return answer.eq(BigNumbers.one());
  }
}
