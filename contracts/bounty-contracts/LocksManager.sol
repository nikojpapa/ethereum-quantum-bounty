// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

contract LockManager {
  bool[] public lockSolvedStatus;
  uint256 public numberOfLocks;

  bytes[][] internal locks;

  constructor(uint256 numberOfLocksInit) {
    locks = new bytes[][](numberOfLocksInit);
    lockSolvedStatus = new bool[](numberOfLocks);
    numberOfLocks = numberOfLocksInit;
  }

  function setLock(uint256 lockNumber, bytes[] memory value) public {
    locks[lockNumber] = value;
  }

  function getLock(uint256 lockNumber) public view returns (bytes[] memory) {
    return locks[lockNumber];
  }

  function setLocksSolvedStatus(uint256 lockNumber, bool status) public {
    lockSolvedStatus[lockNumber] = status;
  }

  function allLocksSolved() public view returns (bool) {
    bool allSolved = true;
    for (uint256 lockNumber = 0; lockNumber < lockSolvedStatus.length; lockNumber++) {
      if (!lockSolvedStatus[lockNumber]) {
        allSolved = false;
        break;
      }
    }
    return allSolved;
  }
}
