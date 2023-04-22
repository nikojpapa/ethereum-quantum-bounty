// SPDX-License-Identifier: GPL-3.0
import "https://raw.githubusercontent.com/firoorg/solidity-BigNumber/ca66e95ec3ef32250b0221076f7a10f0d8529bd8/src/BigNumbers.sol";

import "./RandomNumberGenerator.sol";
import "../BountyContract.sol";

contract PrimeFactoringBounty is BountyContract, RandomNumberGenerator {

  constructor() BountyContract() RandomNumberGenerator() {
    generateLargePrimes();
  }

  function _verifySolutions(bytes[][] memory solutions) private view override returns (bool) {
    for (int lockNumber = 0; lockNumber < locks.length; lockNumber++) {
      BigNumber lock = lock[lockNumber];

      bytes[] lockSolutions = solutions[lockNumber];
      BigNumber[] primeFactors;
      for (uint256 i = 0; i < lockSolutions.length; i++) {
        primeFactors[i] = BigNumber.init(lockSolutions[i], false);
      }

      BigNumber product = 1;
      for (uint256 i = 0; i < primeFactors.length; i++) {
        BigNumber primeFactor = primeFactors[i];
        require(_isMillerRabinPassed(primeFactor), 'Given solution is not prime');
        product = BigNumber.mul(product, primeFactor);
      }

      if (!BigNumber.eq(product)) return false;
    }
    return true;
  }
}
