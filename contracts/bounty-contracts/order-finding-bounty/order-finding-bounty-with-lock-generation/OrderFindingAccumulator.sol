// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/math/Math.sol";

import "../../BigNumbers.sol";
import "../OrderFindingBounty.sol";


contract OrderFindingAccumulator is OrderFindingBounty {
  using BigNumbers for *;

  bool public generationIsDone;
  uint8 public parametersPerLock = 2;

  bytes private currentBytes;
  uint256 private currentLockNumber;
  uint256 private bytesPerLock;

  constructor(uint256 numberOfLocks, uint256 bytesPerLockInit)
    OrderFindingBounty(numberOfLocks)
  {
    _resetBytes();
    bytesPerLock = bytesPerLockInit;
  }

  function accumulate(bytes memory randomBytes) internal {
    if (generationIsDone) return;

    uint256 numBytesToAccumulate = Math.min(randomBytes.length, bytesPerLock - currentBytes.length);
    bytes memory bytesToAccumulate = BytesLib.slice(randomBytes, 0, numBytesToAccumulate);
    currentBytes = BytesLib.concat(currentBytes, bytesToAccumulate);

    if (currentBytes.length >= bytesPerLock) {
      if (locks[currentLockNumber].length == 0) {
        locks[currentLockNumber] = new bytes[](parametersPerLock);
        locks[currentLockNumber][0] = _ensureFirstBitIsSet(currentBytes);
      } else if (locks[currentLockNumber][0].init(false).gt(currentBytes.init(false))) {
        locks[currentLockNumber][1] = currentBytes;
        ++currentLockNumber;
      }
      _resetBytes();
    }
    if (currentLockNumber >= numberOfLocks) generationIsDone = true;
  }

  function _ensureFirstBitIsSet(bytes memory value) private returns (bytes memory) {
    BigNumber memory shiftedRight = value.init(false).shr(1);
    BigNumber memory leftmostOne = BigNumbers.one().shl(shiftedRight.bitlen);
    BigNumber memory finalValue = leftmostOne.add(shiftedRight);
    return BytesLib.slice(finalValue.val, finalValue.val.length - value.length, value.length);
  }

  function _resetBytes() private {
    currentBytes = "";
  }
}
