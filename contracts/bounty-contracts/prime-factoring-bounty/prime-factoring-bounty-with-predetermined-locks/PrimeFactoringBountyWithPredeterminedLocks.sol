// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "../PrimeFactoringBounty.sol";
import "../../LocksManager.sol";

contract PrimeFactoringBountyWithPredeterminedLocks is PrimeFactoringBounty {
  constructor(uint256 numberOfLocks)
    PrimeFactoringBounty(numberOfLocks)
  {}

  function setLock(uint256 lockNumber, bytes[] memory lock) public {
    lockManager.setLock(lockNumber, lock);
  }
}
