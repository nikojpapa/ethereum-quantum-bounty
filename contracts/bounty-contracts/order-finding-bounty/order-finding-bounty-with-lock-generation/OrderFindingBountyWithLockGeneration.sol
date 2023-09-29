// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "./OrderFindingAccumulator.sol";


contract OrderFindingBountyWithLockGeneration is OrderFindingBounty {
  uint256 private iteration;

  OrderFindingAccumulator private orderFindingAccumulator;

  constructor(uint256 numberOfLocksInit, uint256 byteSizeOfModulusInit)
    OrderFindingBounty(numberOfLocksInit)
  {
    orderFindingAccumulator = new OrderFindingAccumulator(numberOfLocksInit, byteSizeOfModulusInit);
  }

  function lockManager() internal view override returns (LockManager) {
    return orderFindingAccumulator;
  }

  function isCheckingPrime() public view returns (bool) {
    return orderFindingAccumulator.isCheckingPrime();
  }

  function currentPrimeCheck() public view returns (bytes memory) {
    return orderFindingAccumulator.currentPrimeCheck();
  }

  function triggerLockAccumulation() public {
    require(!generationIsDone(), 'Locks have already been generated');
    bytes memory randomNumber = '';
    if (!orderFindingAccumulator.isCheckingPrime()) randomNumber = _generateRandomBytes();
    orderFindingAccumulator.accumulate(randomNumber);
  }

  function generationIsDone() public view returns (bool) {
    return orderFindingAccumulator.generationIsDone();
  }

  function _generateRandomBytes() private returns (bytes memory) {
    return abi.encodePacked(keccak256(abi.encodePacked(block.difficulty, iteration++)));
  }
}
