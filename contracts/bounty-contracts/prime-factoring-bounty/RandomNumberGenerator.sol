//// SPDX-License-Identifier: GPL-3.0
//pragma solidity ^0.8.12;
//
//import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
//
//import "./MillerRabin.sol";
//import "./BigNumbers.sol";
//
///*
// * Adapted from https://www.geeksforgeeks.org/how-to-generate-large-prime-numbers-for-rsa-algorithm/
// * Adapted from https://medium.com/@ntnprdhmm/how-to-generate-big-prime-numbers-miller-rabin-49e6e6af32fb
// */
//contract RandomNumberGenerator is VRFConsumerBase {
//  bytes32 internal keyHash;
//  uint256 internal fee;
//
//  bytes[3] public locks;
//  BigNumber[2] private primeNumbers;
//  uint8 lockCounter = 0;
//
//  constructor()
//  VRFConsumerBase(
//    0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9, // VRF Coordinator
//    0xa36085F69e2889c224210F603D836748e7dC0088  // LINK Token
//  ) public
//  {
//    keyHash = 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4;
//    fee = 0; //0.1 * 10 ** 18; // 0.1 LINK
//  }
//
//  function generateLargePrimes(uint256 userProvidedSeed) public returns (bytes32 requestId) {
//    require(LINK.balanceOf(address(this)) > fee, "Not enough LINK - fill contract with faucet");
//    return requestRandomness(keyHash, fee, 0);
//  }
//
//  function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
//    uint256 primeCandidate = randomness | (1 << 255) | 1;
//    if (MillerRabin.isMillerRabinPassed(primeCandidate)) {
//      uint8 randomPrimesIndex = 0 + (!BigNumber.isZero(primeNumbers[0]));
//      primeNumbers[randomPrimesIndex] = BigNumber.init(randomness, false);
//      if (randomPrimesIndex > 0) {
//        locks[lockCounter] = BigNumber.mul(primeNumbers[0], primeNumbers[1]).val;
//        ++lockCounter;
//      }
//      if (lockCounter < locks.length) generateLargePrimes();
//    } else {
//      generateLargePrimes();
//    }
//  }
//}
