// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";
import "../PrimeFactoringBounty.sol";


contract RsaUfoAccumulator is PrimeFactoringBounty {
  bool public generationIsDone;

  uint256 private bytesPerPrime;

  bytes private currentLock;
  uint256 private currentLockNumber;
  uint256 private bytesPerLock;

  constructor(uint256 numberOfLocks, uint256 bytesPerPrimeInit)
    PrimeFactoringBounty(numberOfLocks)
  {
    bytesPerPrime = bytesPerPrimeInit;

    currentLock = "";
    bytesPerLock = 3 * bytesPerPrime;
  }

  function accumulate(bytes memory randomBytes) internal {
    if (generationIsDone) return;

    uint256 numBytesToAccumulate = Math.min(randomBytes.length, bytesPerLock - currentLock.length);
    bytes memory bytesToAccumulate = BytesLib.slice(randomBytes, 0, numBytesToAccumulate);
    currentLock = BytesLib.concat(currentLock, bytesToAccumulate);

    if (currentLock.length >= bytesPerLock) {
      locks[currentLockNumber] = currentLock;
      ++currentLockNumber;
      currentLock = "";
    }

    if (currentLockNumber >= numberOfLocks) generationIsDone = true;
  }
}
