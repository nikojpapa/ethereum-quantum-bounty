// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "./RsaUfoAccumulator.sol";

contract RsaUfoAccumulatorTestHelper {
  Accumulator private accumulator;

  constructor(uint256 numberOfLocks, uint256 bytesPerPrime) {
    accumulator = RsaUfoAccumulator.init(numberOfLocks, bytesPerPrime);
  }

  function triggerAccumulate(bytes memory randomBytes) public {
    RsaUfoAccumulator.accumulate(accumulator, randomBytes);
  }
}
