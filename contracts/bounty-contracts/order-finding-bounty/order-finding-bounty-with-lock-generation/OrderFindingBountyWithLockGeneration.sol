// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "./OrderFindingAccumulator.sol";


contract OrderFindingBountyWithLockGeneration is OrderFindingAccumulator {
  uint256 private iteration;

  constructor(uint256 numberOfLocksInit, uint256 byteSizeOfModulus)
    OrderFindingAccumulator(numberOfLocksInit, byteSizeOfModulus) {}

  function triggerLockAccumulation() public {
    require(!generationIsDone, 'Locks have already been generated');
    bytes memory randomNumber = abi.encodePacked(keccak256(abi.encodePacked(block.difficulty, iteration++)));
    accumulate(randomNumber);
  }
}
