// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/math/Math.sol";

import "../../BigNumbers.sol";
import "../OrderFindingBounty.sol";


contract RandomOrderFindingAccumulator is OrderFindingBounty {
  using BigNumbers for *;

  bool public generationIsDone;

  bytes private currentBytes;
  uint256 private currentLockNumber;
  uint256 private bytesPerLock;

  constructor(uint256 numberOfLocks, uint256 bytesPerLockInit)
    OrderFindingBounty(numberOfLocks)
  {
    resetBytes();
    bytesPerLock = bytesPerLock;
  }

  function accumulate(bytes memory randomBytes) internal {
    if (generationIsDone) return;

    uint256 numBytesToAccumulate = Math.min(randomBytes.length, bytesPerLock - currentBytes.length);
    bytes memory bytesToAccumulate = BytesLib.slice(randomBytes, 0, numBytesToAccumulate);
    currentBytes = BytesLib.concat(currentBytes, bytesToAccumulate);

    if (currentBytes.length >= bytesPerLock) {
      if (locks[currentLockNumber].length == 0) {
        locks[currentLockNumber][0] = BytesLib.concat(bytes('1'), currentBytes.init(false).shr(1).val);
      } else if (locks[currentLockNumber][0].init(false).gt(currentBytes.init(false))) {
        locks[currentLockNumber][1] = currentBytes;
        ++currentLockNumber;
      }
      resetBytes();
    }
    if (currentLockNumber >= numberOfLocks) generationIsDone = true;
  }

  function resetBytes() internal virtual {
    currentBytes = "";
  }
}
