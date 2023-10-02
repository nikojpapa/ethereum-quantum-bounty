// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../PrimeFactoringBounty.sol";
import "../../LocksManager.sol";


struct Accumulator {
  Locks locks;
  bool generationIsDone;

  bytes _currentLock;
  uint256 _currentLockNumber;
  uint256 _bytesPerLock;
}


library RsaUfoAccumulator {

  function init(uint256 numberOfLocks, uint256 bytesPerLock) internal returns (Accumulator memory accumulator)
  {
    accumulator.locks = LockManager.init(numberOfLocks);
    accumulator._bytesPerLock = bytesPerLock;
    return accumulator;
  }

  function accumulate(Accumulator storage accumulator, bytes memory randomBytes) internal {
    if (accumulator.generationIsDone) return;

    uint256 numBytesToAccumulate = Math.min(randomBytes.length, accumulator._bytesPerLock - accumulator._currentLock.length);
    bytes memory bytesToAccumulate = BytesLib.slice(randomBytes, 0, numBytesToAccumulate);
    accumulator._currentLock = BytesLib.concat(accumulator._currentLock, bytesToAccumulate);

    if (accumulator._currentLock.length >= accumulator._bytesPerLock) {
      accumulator.locks.locks[accumulator._currentLockNumber] = [accumulator._currentLock];
      ++accumulator._currentLockNumber;
      accumulator._currentLock = '';
    }
    if (accumulator._currentLockNumber >= accumulator.locks.numberOfLocks) accumulator.generationIsDone = true;
  }
}
