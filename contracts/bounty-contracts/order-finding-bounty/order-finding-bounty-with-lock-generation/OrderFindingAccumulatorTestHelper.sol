// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "./OrderFindingAccumulator.sol";

contract OrderFindingAccumulatorTestHelper {
  Accumulator private accumulator;

  constructor(uint256 numberOfLocks, uint256 bytesPerPrime) {
    accumulator = OrderFindingAccumulator.init(numberOfLocks, bytesPerPrime);
  }

  function triggerAccumulate(bytes memory randomBytes) public {
    OrderFindingAccumulator.accumulate(accumulator, randomBytes);
  }
}
