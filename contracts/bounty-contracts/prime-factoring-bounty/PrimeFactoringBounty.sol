// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../BountyContract.sol";
import "./BigNumbers.sol";
import "./miller-rabin/MillerRabin.sol";

abstract contract PrimeFactoringBounty is BountyContract {
  using BigNumbers for *;

  function _verifySolutions(bytes[][] memory solutions) internal view override _locksHaveBeenSet returns (bool) {
    for (uint256 lockNumber = 0; lockNumber < locks.length; lockNumber++) {
      bytes[] memory lockSolutions = solutions[lockNumber];

      BigNumber memory product = BigNumbers.one();
      for (uint256 i = 0; i < lockSolutions.length; i++) {
        bytes memory primeFactor = lockSolutions[i];
        require(MillerRabin.isPrime(primeFactor), 'Given solution is not prime');
        product = product.mul(primeFactor.init(false));
      }

      BigNumber memory lock = locks[lockNumber].init(false);
      if (!product.eq(lock)) return false;
    }
    return true;
  }

  modifier _locksHaveBeenSet() {
    require(locks.length > 0, 'Locks array has not been initialized');
    require(!BytesLib.equal(locks[locks.length - 1], ''), 'Locks values have not been set');
    _;
  }
}
