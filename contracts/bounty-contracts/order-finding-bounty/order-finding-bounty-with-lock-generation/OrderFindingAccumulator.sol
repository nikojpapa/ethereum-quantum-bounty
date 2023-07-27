// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "../OrderFindingBounty.sol";


contract OrderFindingAccumulator is OrderFindingBounty {
  using BigNumbers for *;

  bool public generationIsDone;
  uint8 public parametersPerLock = 2;

  bytes private currentBytes;
  uint256 private currentLockNumber;
  uint256 private bytesPerLock;

  uint8 private _BITS_PER_BYTE = 8;

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
      if (locks[currentLockNumber].length == 0) locks[currentLockNumber] = new bytes[](parametersPerLock);

      if (locks[currentLockNumber][0].length == 0) {
        locks[currentLockNumber][0] = _ensureFirstBitIsSet(currentBytes);
      } else {
        BigNumber memory modulus = locks[currentLockNumber][0].init(false);
        BigNumber memory base = currentBytes.init(false).mod(modulus);
        BigNumber memory negativeOne = BigNumbers.zero().sub(BigNumbers.one()).mod(modulus);

        bool hasTrivialOrder = base.eq(BigNumbers.one()) || base.eq(negativeOne);
        if (!hasTrivialOrder && _isCoprime(base, modulus)) {
          locks[currentLockNumber][1] = _slicePrefix(base.val);
          ++currentLockNumber;
        }
      }
      _resetBytes();
    }
    if (currentLockNumber >= numberOfLocks) generationIsDone = true;
  }

  function _ensureFirstBitIsSet(bytes memory value) private returns (bytes memory) {
    BigNumber memory asBigNumber = value.init(false);
    uint256 amountToShift = value.length * _BITS_PER_BYTE - 1;
    BigNumber memory firstBit = asBigNumber.shr(amountToShift);
    BigNumber memory notFirstBit = BigNumbers.one().sub(firstBit);
    BigNumber memory bitwiseOrValue = notFirstBit.shl(amountToShift);
    BigNumber memory finalValue = value.init(false).add(bitwiseOrValue);
    return _slicePrefix(finalValue.val);
  }

  /* Adapted rom https://gist.github.com/3esmit/8c0a63f17f2f2448cc1576eb27fe5910
   */
  function _isCoprime(BigNumber memory a, BigNumber memory b) private view returns (bool) {
    BigNumber memory _a = a;
    BigNumber memory _b = b;
    BigNumber memory temp;
    while (_b.gt(BigNumbers.zero())) {
      temp = _b;
      _b = _a.mod(_b);
      _a = temp;
    }
    return _a.eq(BigNumbers.one());
  }

  function _slicePrefix(bytes memory value) private view returns (bytes memory) {
    return BytesLib.slice(value, value.length - bytesPerLock, bytesPerLock);
  }

  function _resetBytes() private {
    currentBytes = "";
  }
}
