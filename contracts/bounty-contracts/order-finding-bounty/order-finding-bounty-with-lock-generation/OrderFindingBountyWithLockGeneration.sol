// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../../BigNumbers.sol";
import "./RandomOrderFindingAccumulator.sol";


contract OrderFindingBountyWithRsaUfo is RandomOrderFindingAccumulator {
  uint256 private iteration;

  constructor(uint256 numberOfLocksInit, uint256 byteSizeOfModulus)
    RandomOrderFindingAccumulator(numberOfLocksInit, byteSizeOfModulus) {}

  function triggerLockAccumulation() public {
    require(!generationIsDone, 'Locks have already been generated');
    bytes memory randomNumber = abi.encodePacked(keccak256(abi.encodePacked(block.difficulty, iteration++)));
    accumulate(randomNumber);
  }
}
