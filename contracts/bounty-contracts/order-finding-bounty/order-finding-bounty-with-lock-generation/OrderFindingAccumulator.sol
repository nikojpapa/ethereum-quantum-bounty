// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";
import "../../LocksManager.sol";
import "../../BigNumbers.sol";

  struct Accumulator {
  Locks locks;
  bool generationIsDone;
  uint8 parametersPerLock;

  bytes _currentBytes;
  uint256 _currentLockNumber;
  uint256 _bytesPerLock;

  BigNumber _a;
  BigNumber _b;
  BigNumber _baseToCheck;
}


library OrderFindingAccumulator {
  using BigNumbers for *;

  uint8 private constant _BITS_PER_BYTE = 8;

  function init(uint256 numberOfLocks, uint256 bytesPerLock) internal returns (Accumulator memory accumulator)
  {
    accumulator.locks = LockManager.init(numberOfLocks);
    accumulator._bytesPerLock = bytesPerLock;
//    _resetBytes(accumulator);
    return accumulator;
  }

  function accumulate(Accumulator storage accumulator, bytes memory randomBytes) internal {
    if (accumulator.generationIsDone) return;
    if (accumulator._baseToCheck.bitlen > 0) {
      _isCoprime(accumulator);
      return;
    }

    uint256 numBytesToAccumulate = Math.min(randomBytes.length, accumulator._bytesPerLock - accumulator._currentBytes.length);
    bytes memory bytesToAccumulate = BytesLib.slice(randomBytes, 0, numBytesToAccumulate);
    accumulator._currentBytes = BytesLib.concat(accumulator._currentBytes, bytesToAccumulate);

    if (accumulator._currentBytes.length >= accumulator._bytesPerLock) {
      if (accumulator.locks.locks[accumulator._currentLockNumber].length == 0) {
        accumulator.locks.locks[accumulator._currentLockNumber] = new bytes[](accumulator.parametersPerLock);
      }

      if (accumulator.locks.locks[accumulator._currentLockNumber][0].length == 0) {
        _setFirstBit(accumulator._currentBytes);
        accumulator.locks.locks[accumulator._currentLockNumber][0] = accumulator._currentBytes;
      } else {
        BigNumber memory modulus = accumulator.locks.locks[accumulator._currentLockNumber][0].init(false);
        BigNumber memory base = accumulator._currentBytes.init(false).mod(modulus);
        BigNumber memory negativeOne = modulus.sub(BigNumbers.one());

        bool hasTrivialOrder = base.eq(BigNumbers.one()) || base.eq(negativeOne);
        if (!hasTrivialOrder) {
          accumulator._a = modulus;
          accumulator._b = accumulator._baseToCheck = base;
          return;
        }
      }
      _resetBytes(accumulator);
    }
  }

  function _setFirstBit(bytes storage value) private {
    value[0] |= bytes1(uint8(1 << 7));
  }

  /* Adapted rom https://gist.github.com/3esmit/8c0a63f17f2f2448cc1576eb27fe5910
   */
  function _isCoprime(Accumulator storage accumulator) private {
    bool checkIsFinished = accumulator._b.isZero();
    if (checkIsFinished) {
      bool isCoprime = accumulator._a.eq(BigNumbers.one());
      if (isCoprime) {
        accumulator.locks.locks[accumulator._currentLockNumber][1] = _slicePrefix(accumulator);
        ++accumulator._currentLockNumber;
        if (accumulator._currentLockNumber >= accumulator.locks.numberOfLocks) accumulator.generationIsDone = true;
      }
      _resetBytes(accumulator);
    } else {
      BigNumber memory temp = accumulator._b;
      accumulator._b = accumulator._a.mod(accumulator._b);
      accumulator._a = temp;
    }
  }

  function _slicePrefix(Accumulator storage accumulator) private view returns (bytes memory) {
    bytes memory value = accumulator._baseToCheck.val;
    return BytesLib.slice(value, value.length - accumulator._bytesPerLock, accumulator._bytesPerLock);
  }

  function _resetBytes(Accumulator storage accumulator) private {
    accumulator._currentBytes = '';
    accumulator._a = BigNumber('', false, 0);
    accumulator._b = BigNumber('', false, 0);
    accumulator._baseToCheck = BigNumber('', false, 0);
  }

  function isCheckingPrime(Accumulator storage accumulator) public view returns (bool) {
    return accumulator._baseToCheck.bitlen > 0;
  }

  function currentPrimeCheck(Accumulator storage accumulator) public view returns (bytes memory) {
    return accumulator._b.val;
  }
}
