// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../BountyContract.sol";
import "./BigNumbers.sol";
import "./MillerRabin.sol";
import "./RandomNumberGenerator.sol";

contract PrimeFactoringBounty is BountyContract, VRFConsumerBase {
  using BigNumbers for *;

  bytes32 internal keyHash;
  uint256 internal fee;

  uint256 private primeNumberBitSize;
  uint256 private numberOfPrimesPerLock;
  bytes[] private primeNumbers;
  bytes private primeCandidate;
  uint8 private randomPrimesCounter = 0;

  constructor(uint256 numberOfLocks, uint256 primesBitSize, uint256 primesPerLock)
    BountyContract()
    VRFConsumerBase(
      0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9, // VRF Coordinator
      0xa36085F69e2889c224210F603D836748e7dC0088  // LINK Token
    )
  {
    keyHash = 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4;
    fee = 0; //0.1 * 10 ** 18; // 0.1 LINK

    locks = new bytes[](numberOfLocks);
    primeNumberBitSize = primesBitSize;
    numberOfPrimesPerLock = primesPerLock;
    primeNumbers = new bytes[](primesPerLock * numberOfLocks);
    primeCandidate = BigNumbers.ZERO;

    generateLargePrimes();
  }

  function generateLargePrimes() public returns (bytes32 requestId) {
    require(LINK.balanceOf(address(this)) > fee, "Not enough LINK - fill contract with faucet");
    return requestRandomness(keyHash, fee);
  }

  function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
    primeCandidate = BytesLib.concat(primeCandidate, abi.encodePacked(randomness | (1 << 255) | 1));
    if (primeCandidate.init(false).bitlen < primeNumberBitSize) {
      generateLargePrimes();
      return;
    }
    primeCandidate = BytesLib.slice(primeCandidate, 0, primeNumberBitSize);

    if (MillerRabin.isPrime(primeCandidate)) {
      primeNumbers[randomPrimesCounter] = primeCandidate;
      randomPrimesCounter++;

      if (randomPrimesCounter >= primeNumbers.length) {
        for (uint256 lockCounter = 0; lockCounter < locks.length; lockCounter++) {
          uint256 primeNumberIndexStart = lockCounter * numberOfPrimesPerLock;
          uint256 primeNumberIndexEnd = primeNumberIndexStart + primeNumberIndexStart;

          BigNumber memory product = BigNumbers.one();
          for (uint256 primeComponentIndex = primeNumberIndexStart; primeComponentIndex < primeNumberIndexEnd; primeComponentIndex++) {
            product = product.mul(primeNumbers[primeComponentIndex].init(false));
          }
          locks[lockCounter] = product.val;
        }
        return;
      }
    }
    primeCandidate = BigNumbers.ZERO;
    generateLargePrimes();
  }

  function _verifySolutions(bytes[][] memory solutions) internal view override returns (bool) {
    for (uint256 lockNumber = 0; lockNumber < locks.length; lockNumber++) {
      bytes[] memory lockSolutions = solutions[lockNumber];
      uint256[] memory primeFactors;
      for (uint256 i = 0; i < lockSolutions.length; i++) {
        primeFactors[i] = BytesLib.toUint256(lockSolutions[i], 0);
      }

      BigNumber memory product = BigNumbers.one();
      for (uint256 i = 0; i < primeFactors.length; i++) {
        uint256 primeFactor = primeFactors[i];
        require(MillerRabin.isPrime(abi.encodePacked(primeFactor)), 'Given solution is not prime');
        product = product.mul(primeFactor.init(false));
      }

      BigNumber memory lock = locks[lockNumber].init(false);
      if (!product.eq(lock)) return false;
    }
    return true;
  }
}
