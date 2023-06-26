// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "./RsaUfoAccumulator.sol";

contract RsaUfoAccumulatorTestHelper is RsaUfoAccumulator {
  constructor(uint256 numberOfLocksInit, uint256 bytesPerPrimeInit)
    RsaUfoAccumulator(numberOfLocksInit, bytesPerPrimeInit) {}

  function triggerAccumulate(bytes memory randomBytes) public {
    accumulate(randomBytes);
  }
}
