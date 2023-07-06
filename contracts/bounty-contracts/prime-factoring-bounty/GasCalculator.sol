// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "./miller-rabin/MillerRabin.sol";
import "./BigNumbers.sol";

contract GasCalculator {
  using BigNumbers for *;

  function millerRabinOnMultipleNumbers(bytes[] memory primeCandidates) public {
    for (uint256 i = 0; i < primeCandidates.length; i++) {
      MillerRabin.isPrime(primeCandidates[i]);
    }
  }

  function multiplyNumbers(bytes[] memory numbers) public {
    BigNumber memory product = BigNumbers.one();
    for (uint256 i = 0; i < numbers.length; i++) {
      bytes memory primeFactor = numbers[i];
      product = product.mul(primeFactor.init(false));
    }
  }

  function compareNumbers(bytes memory number1, bytes memory number2) public {
    number2.init(false).eq(number1.init(false));
  }

  function generateRandomBytes() public {
    abi.encodePacked(keccak256(abi.encodePacked(block.difficulty, uint256(0))));
  }
}
