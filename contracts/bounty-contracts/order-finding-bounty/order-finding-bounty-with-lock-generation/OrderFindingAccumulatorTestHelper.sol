// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "./OrderFindingAccumulator.sol";

contract OrderFindingAccumulatorTestHelper is OrderFindingAccumulator {
  constructor(uint256 numberOfLocksInit, uint256 bytesPerPrimeInit)
    OrderFindingAccumulator(numberOfLocksInit, bytesPerPrimeInit) {}

  function triggerAccumulate(bytes memory randomBytes) public {
    accumulate(randomBytes);
  }
}
