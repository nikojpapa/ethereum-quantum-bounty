// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "../PrimeFactoringBounty.sol";

contract PrimeFactoringBountyWithPredeterminedLocks is PrimeFactoringBounty {
  constructor(bytes[] memory predeterminedLocks)
    PrimeFactoringBounty()
  {
    locks = new bytes[](predeterminedLocks.length);
    for (uint256 lockNumber = 0; lockNumber < predeterminedLocks.length; lockNumber++) {
      locks[lockNumber] = predeterminedLocks[lockNumber];
    }
  }
}
