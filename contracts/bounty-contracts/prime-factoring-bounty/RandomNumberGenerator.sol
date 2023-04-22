// SPDX-License-Identifier: GPL-3.0
import "https://raw.githubusercontent.com/smartcontractkit/chainlink/63797462359524189067c6aa8300272042561296/contracts/src/v0.6/VRFConsumerBase.sol";
import "https://raw.githubusercontent.com/firoorg/solidity-BigNumber/ca66e95ec3ef32250b0221076f7a10f0d8529bd8/src/BigNumbers.sol";

/*
 * Adapted from https://www.geeksforgeeks.org/how-to-generate-large-prime-numbers-for-rsa-algorithm/
 * Adapted from https://medium.com/@ntnprdhmm/how-to-generate-big-prime-numbers-miller-rabin-49e6e6af32fb
 */
contract RandomNumberGenerator is VRFConsumerBase {
  bytes32 internal keyHash;
  uint256 internal fee;
  bytes[3] public locks;
  BigNumber[2] private primeNumbers;
  uint8 lockCounter = 0;

  constructor()
  VRFConsumerBase(
    0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9, // VRF Coordinator
    0xa36085F69e2889c224210F603D836748e7dC0088  // LINK Token
  ) public
  {
    keyHash = 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4;
    fee = 0; //0.1 * 10 ** 18; // 0.1 LINK
  }

  /**
  * Requests randomness from a user-provided seed
  */
  function generateLargePrimes(uint256 userProvidedSeed) public returns (bytes32 requestId) {
    require(LINK.balanceOf(address(this)) > fee, "Not enough LINK - fill contract with faucet");
    return requestRandomness(keyHash, fee, 0);
  }

  /**
   * @notice Callback function used by VRF Coordinator
     * @dev Important! Add a modifier to only allow this function to be called by the VRFCoordinator
     * @dev This is where you do something with randomness!
     * @dev The VRF Coordinator will only send this function verified responses.
     * @dev The VRF Coordinator will not pass randomness that could not be verified.
     */
  function fulfillRandomness(bytes32 requestId, uint256 randomness) external override onlyVRFCoordinator {
    uint256 primeCandidate = randomness | (1 << 255) | 1;
    if (_isMillerRabinPassed(primeCandidate)) {
      uint8 randomPrimesIndex = 0 + (!BigNumber.isZero(primeNumbers[0]));
      primeNumbers[randomPrimesIndex] = BigNumber.init(randomness, false);
      if (randomPrimesIndex > 0) {
        locks[lockCounter] = BigNumber.mul(primeNumbers[0], primeNumbers[1]).val;
        ++lockCounter;
      }
      if (lockCounter < locks.length) generateLargePrimes();
    } else {
      generateLargePrimes();
    }
  }

  /**
   * @notice Modifier to only allow updates by the VRFCoordinator contract
     */
  modifier onlyVRFCoordinator {
    require(msg.sender == vrfCoordinator, 'Fulfillment only allowed by VRFCoordinator');
    _;
  }

  /*
   * Run 20 iterations of Rabin Miller Primality test
   */
  function _isMillerRabinPassed(uint256 millerRabinCandidate) private returns (bool) {

    uint256 maxDivisionsByTwo = 0;
    uint256 evenComponent = millerRabinCandidate - 1;

    while (evenComponent & 1 == 0) {
      maxDivisionsByTwo += 1;
      evenComponent >>= 1;
    }

    uint256 numberOfRabinTrials = 128;
    for (uint256 i = 0; i < numberOfRabinTrials ; i++) {
      uint256 roundTester = Math.random() * (millerRabinCandidate - 2) + 2;

      if (_trialComposite(roundTester, evenComponent, millerRabinCandidate, maxDivisionsByTwo))
        return false;
    }
    return true;
  }

  function _trialComposite(
      uint256 roundTester,
      uint256 evenComponent,
      uint256 millerRabinCandidate,
      uint256 maxDivisionsByTwo) private returns (bool) {
    uint256 x = _expmod(roundTester, evenComponent, millerRabinCandidate);
    if (x == 1 || x == millerRabinCandidate - 1) {
      return false;
    }

    for (uint256 i = 0; i < maxDivisionsByTwo; i++) {
      x = _expmod(roundTester, evenComponent, millerRabinCandidate);
      if (_expmod(roundTester, 2**i * evenComponent, millerRabinCandidate) == millerRabinCandidate - 1) {
        return false;
      }
    }
    return true;
  }

  /*
   * This function calculates (base ^ exp) % mod
   */
  function _expmod(uint256 base, uint256 exp, uint256 mod) private returns (uint256) {
    if (exp == 0) return 1;
    if (exp % 2 == 0) {
      return (_expmod(base, (exp / 2), mod) ** 2) % mod;
    } else {
      return (base * _expmod( base, (exp - 1), mod)) % mod;
    }
  }
}
