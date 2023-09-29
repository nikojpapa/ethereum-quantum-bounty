// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "../OrderFindingBounty.sol";
import "../../LocksManager.sol";


contract OrderFindingAccumulator is LockManager {
  using BigNumbers for *;

  bool public generationIsDone;
  uint8 public parametersPerLock = 2;

  bytes private currentBytes;
  uint256 private currentLockNumber;
  uint256 private bytesPerLock;

  uint8 private _BITS_PER_BYTE = 8;

  BigNumber private _a;
  BigNumber private _b;
  BigNumber private baseToCheck;

  constructor(uint256 numberOfLocksInit, uint256 bytesPerLockInit)
    LockManager(numberOfLocksInit)
  {
    _resetBytes();
    bytesPerLock = bytesPerLockInit;
  }

  function accumulate(bytes memory randomBytes) public {
    if (generationIsDone) return;
    if (baseToCheck.bitlen > 0) {
      _isCoprime();
      return;
    }

    uint256 numBytesToAccumulate = Math.min(randomBytes.length, bytesPerLock - currentBytes.length);
    bytes memory bytesToAccumulate = BytesLib.slice(randomBytes, 0, numBytesToAccumulate);
    currentBytes = BytesLib.concat(currentBytes, bytesToAccumulate);

    if (currentBytes.length >= bytesPerLock) {
      if (locks[currentLockNumber].length == 0) locks[currentLockNumber] = new bytes[](parametersPerLock);

      if (locks[currentLockNumber][0].length == 0) {
        _setFirstBit(currentBytes);
        locks[currentLockNumber][0] = currentBytes;
      } else {
        BigNumber memory modulus = locks[currentLockNumber][0].init(false);
        BigNumber memory base = currentBytes.init(false).mod(modulus);
        BigNumber memory negativeOne = modulus.sub(BigNumbers.one());

        bool hasTrivialOrder = base.eq(BigNumbers.one()) || base.eq(negativeOne);
        if (!hasTrivialOrder) {
          _a = modulus;
          _b = baseToCheck = base;
          return;
        }
      }
      _resetBytes();
    }
  }

  function _setFirstBit(bytes storage value) private {
    value[0] |= bytes1(uint8(1 << 7));
  }

  /* Adapted rom https://gist.github.com/3esmit/8c0a63f17f2f2448cc1576eb27fe5910
   */
  function _isCoprime() private {
    bool checkIsFinished = _b.isZero();
    if (checkIsFinished) {
      bool isCoprime = _a.eq(BigNumbers.one());
      if (isCoprime) {
        locks[currentLockNumber][1] = _slicePrefix(baseToCheck.val);
        ++currentLockNumber;
        if (currentLockNumber >= numberOfLocks) generationIsDone = true;
      }
      _resetBytes();
    } else {
      BigNumber memory temp = _b;
      _b = _a.mod(_b);
      _a = temp;
    }
  }

  function _slicePrefix(bytes memory value) private view returns (bytes memory) {
    return BytesLib.slice(value, value.length - bytesPerLock, bytesPerLock);
  }

  function _resetBytes() private {
    currentBytes = '';
    _a = BigNumber('', false, 0);
    _b = BigNumber('', false, 0);
    baseToCheck = BigNumber('', false, 0);
  }

  function isCheckingPrime() public view returns (bool) {
    return baseToCheck.bitlen > 0;
  }

  function currentPrimeCheck() public view returns (bytes memory) {
    return _b.val;
  }
}
