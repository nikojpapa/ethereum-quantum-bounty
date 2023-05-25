// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../BigNumbers.sol";
import "../PrimeFactoringBounty.sol";


/* Using methods based on:
 * - Sander, T. (1999). Efficient Accumulators without Trapdoor Extended Abstract. In: Information and Communication Security, V. Varadharajan and Y. Mu (editors), Second International Conference, ICICS’99, pages 252-262.
 * - https://anoncoin.github.io/RSA_UFO/
 *
 * The number of locks should be log(1-p) / log(1 - 0.16), where p is the probability that at least one lock
 * is difficult to factor.
 */
contract PrimeFactoringPuzzleWithRsaUfo is PrimeFactoringBounty {
  using BigNumbers for *;

  uint256 public numberOfLocks;
  uint256 primeByteLength;

  BigNumber BYTES_PER_256_NUMBER = 32.init(false);

  constructor(uint256 numberOfLocks, uint256 primeByteLengthInit) {
    locks = new bytes[](numberOfLocks);
    primeByteLength = primeByteLengthInit;

    BigNumber memory lockByteLength = 3.init(false).mul(primeByteLength.init(false));

    BigNumber memory oneRandomNumberLessThanNecessary = lockByteLength.sub(BYTES_PER_256_NUMBER);
    uint256 bytesRemaining = BytesLib.toUint256(lockByteLength.mod(BYTES_PER_256_NUMBER).val, 0);
    for (uint256 lockNumber = 0; lockNumber < numberOfLocks; lockNumber++) {
      bytes memory lockBytes = "";
      while (oneRandomNumberLessThanNecessary.gt(lockBytes.length.init(false))) {
        bytes memory randomNumber = _getRandomNumber(lockBytes);
        lockBytes = BytesLib.concat(lockBytes, randomNumber);
      }

      bytes memory randomNumber = _getRandomNumber(lockBytes);
      locks[lockNumber] = BytesLib.concat(lockBytes, BytesLib.slice(randomNumber, 0, bytesRemaining));
    }
  }

  /*
   * From https://www.geeksforgeeks.org/random-number-generator-in-solidity-using-keccak256/
   */
  function _getRandomNumber(bytes memory nonce) private returns (bytes memory) {
    return abi.encodePacked(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce)));
  }
}
