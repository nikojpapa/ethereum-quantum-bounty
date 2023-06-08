// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../BigNumbers.sol";
import "../PrimeFactoringBounty.sol";
import "./RsaUfoAccumulator.sol";


/* Using methods based on:
 * - Sander, T. (1999). Efficient Accumulators without Trapdoor Extended Abstract. In: Information and Communication Security, V. Varadharajan and Y. Mu (editors), Second International Conference, ICICS’99, pages 252-262.
 * - https://anoncoin.github.io/RSA_UFO/
 *
 * The number of locks should be log(1-p) / log(1 - 0.16), where p is the probability that at least one lock
 * is difficult to factor.
 */
contract PrimeFactoringBountyWithRsaUfo is PrimeFactoringBounty {
  RsaUfoAccumulator private rsaUfoAccumulator;

  constructor(uint256 numberOfLocks, uint256 primeByteLengthInit) {
    locks = new bytes[](numberOfLocks);
    rsaUfoAccumulator = new RsaUfoAccumulator(numberOfLocks, primeByteLengthInit);

    uint256 iteration;
    while (!rsaUfoAccumulator.isDone()) rsaUfoAccumulator.accumulate(_getRandomNumber(iteration++));

    for (uint256 lockNumber; lockNumber < numberOfLocks; lockNumber++) {
      locks[lockNumber] = rsaUfoAccumulator.locks(lockNumber);
    }
  }

  function _getRandomNumber(uint256 entropy) private view returns (bytes memory) {
    return abi.encodePacked(keccak256(abi.encodePacked(block.difficulty, entropy)));
  }
}
