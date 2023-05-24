// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/math/Math.sol";

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
  uint256 primeBitLength;

  constructor(uint256 numberOfLocks, uint256 primeBitLengthInit) {
    locks = new bytes[](numberOfLocks);
    primeBitLength = primeBitLengthInit;

    BigNumber memory numberOfBitsNeeded = 3.init(false).mul(primeBitLength.init(false)).mul(numberOfLocks.init(false));
  }
}
