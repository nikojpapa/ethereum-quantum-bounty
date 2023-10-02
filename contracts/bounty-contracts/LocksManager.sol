// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

struct Locks {
  bytes[][] locks;
  uint256 numberOfLocks;
  bool[] solvedStatus;
}

library LockManager {
  function init(uint256 numberOfLocks) internal view returns (Locks memory) {
    return Locks(
      new bytes[][](numberOfLocks),
      numberOfLocks,
      new bool[](numberOfLocks)
    );
  }

  function setLock(Locks storage locks, uint256 lockNumber, bytes[] memory value) internal {
    locks.locks[lockNumber] = value;
  }

  function getLock(Locks storage locks, uint256 lockNumber) internal view returns (bytes[] memory) {
    return locks.locks[lockNumber];
  }

  function setLocksSolvedStatus(Locks storage locks, uint256 lockNumber, bool status) internal {
    locks.solvedStatus[lockNumber] = status;
  }

  function allLocksSolved(Locks storage locks) internal view returns (bool) {
    bool allSolved = true;
    for (uint256 lockNumber = 0; lockNumber < locks.solvedStatus.length; lockNumber++) {
      if (!locks.solvedStatus[lockNumber]) {
        allSolved = false;
        break;
      }
    }
    return allSolved;
  }
}
