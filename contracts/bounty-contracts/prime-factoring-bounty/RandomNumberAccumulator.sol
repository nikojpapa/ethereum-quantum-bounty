// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "./BigNumbers.sol";
import "./MillerRabin.sol";

contract RandomNumberAccumulator {
  using BigNumbers for *;

  bytes[] public locks;
  bool public isDone;
  uint256 public numberOfLocks;

  uint256 private bytesPerPrime;
  uint256 private primesPerLock;
  bytes[] private primeNumbers;
  bytes private primeCandidate;
  uint8 private randomPrimesCounter = 0;


  constructor(uint256 numberOfLocksInit, uint256 primesPerLockInit, uint256 bytesPerPrimeInit) {
    numberOfLocks = numberOfLocksInit;
    locks = new bytes[](numberOfLocks);
    primesPerLock = primesPerLockInit;
    bytesPerPrime = bytesPerPrimeInit;
    primeNumbers = new bytes[](primesPerLock * numberOfLocks);

    _resetPrimeCandidate();
    isDone = false;
  }

  function accumulate (uint256 randomNumber) public _isNotDone {
    if (_primeCandidateIsReset()) {
      randomNumber |= (1 << 255);
      primeCandidate = abi.encodePacked(randomNumber);
      return;
    }
    primeCandidate = BytesLib.concat(primeCandidate, abi.encodePacked(randomNumber));
    if (primeCandidate.length < bytesPerPrime) return;

//    primeCandidate = BytesLib.slice(primeCandidate, 0, bytesPerPrime);

//    BigNumber memory shift = BytesLib.slice(primeCandidate, 0, bytesPerPrime).init(false).shr(1).shl(1);
//    BigNumber memory oddPrimeCandidate = shift.add(BigNumbers.one());
//    primeCandidate = oddPrimeCandidate.val;

    if (MillerRabin.isPrime(primeCandidate)) {
      require(false, 'here');
      primeNumbers[randomPrimesCounter] = primeCandidate;
      randomPrimesCounter++;

      if (randomPrimesCounter >= primeNumbers.length) {
        for (uint256 lockCounter = 0; lockCounter < locks.length; lockCounter++) {
          uint256 primeNumberIndexStart = lockCounter * primesPerLock;
          uint256 primeNumberIndexEnd = primeNumberIndexStart + primesPerLock;

          BigNumber memory product = BigNumbers.one();
          for (uint256 primeComponentIndex = primeNumberIndexStart; primeComponentIndex < primeNumberIndexEnd; primeComponentIndex++) {
            product = product.mul(primeNumbers[primeComponentIndex].init(false));
          }
          locks[lockCounter] = product.val;
        }
        isDone = true;
      }
    }
    _resetPrimeCandidate();
  }

  function _resetPrimeCandidate() private {
    primeCandidate = BigNumbers.ZERO;
  }

  function _primeCandidateIsReset() private returns (bool) {
    return BytesLib.equal(primeCandidate, BigNumbers.ZERO);
  }

  modifier _isNotDone() {
    require(!isDone, 'Already accumulated enough bits');
    _;
  }
}
