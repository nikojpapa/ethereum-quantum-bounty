//import "https://raw.githubusercontent.com/smartcontractkit/chainlink/develop/evm-contracts/src/v0.6/VRFConsumerBase.sol";
//
///*
// * Adapted from https://www.geeksforgeeks.org/how-to-generate-large-prime-numbers-for-rsa-algorithm/
// * Adapted from https://medium.com/@ntnprdhmm/how-to-generate-big-prime-numbers-miller-rabin-49e6e6af32fb
// */
//contract LockGeneration is VRFConsumerBase {
////  uint256[] public firstPrimesList = [
////    2, 3, 5, 7, 11, 13, 17, 19, 23, 29,
////    31, 37, 41, 43, 47, 53, 59, 61, 67,
////    71, 73, 79, 83, 89, 97, 101, 103,
////    107, 109, 113, 127, 131, 137, 139,
////    149, 151, 157, 163, 167, 173, 179,
////    181, 191, 193, 197, 199, 211, 223,
////    227, 229, 233, 239, 241, 251, 257,
////    263, 269, 271, 277, 281, 283, 293,
////    307, 311, 313, 317, 331, 337, 347, 349
////  ];
//
////  bytes32 internal keyHash;
////  uint256 internal fee;
////  uint256 public randomResult;
////
////  constructor()
////  VRFConsumerBase(
////    0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9, // VRF Coordinator
////    0xa36085F69e2889c224210F603D836748e7dC0088  // LINK Token
////  ) public
////  {
////    keyHash = 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4;
////    fee = 0; //0.1 * 10 ** 18; // 0.1 LINK
////  }
////
//////  function generateLargePrime(uint256 bitSize) public returns (uint256) {
//////    while (true) {
//////      uint256 primeCandidate = _getLowLevelPrime(bitSize);
//////      if (!_isMillerRabinPassed(primeCandidate)) {
//////        continue;
//////      }
//////      return primeCandidate;
//////    }
//////    return -1;
//////  }
////
//////  /*
//////   * Generate a prime candidate divisible
//////   * by first primes
//////   *
//////   * Repeat until a number satisfying
//////   * the test isn't found
//////   */
//////  function _getLowLevelPrime(uint8 n) private returns (uint256) {
//////    while (true) {
//////      uint256 primeCandidate = _nBitRandom(n);
//////
//////      bool valid = true;
//////      for (uint256 i = 0; i < firstPrimesList.length; i++) {
//////        uint256 divisor = firstPrimesList[i];
//////        if (primeCandidate % divisor == 0 && divisor**2 <= primeCandidate) {
//////          valid = false;
//////          break;
//////        }
//////      }
//////
//////      if (valid) return primeCandidate;
//////    }
//////    return -1;
//////  }
////
////  /**
////  * Requests randomness from a user-provided seed
////  */
////  function generateLargePrime(uint256 userProvidedSeed) public returns (bytes32 requestId) {
////    require(LINK.balanceOf(address(this)) > fee, "Not enough LINK - fill contract with faucet");
////    return requestRandomness(keyHash, fee, 0);
////  }
////
////  /**
////   * @notice Callback function used by VRF Coordinator
////     * @dev Important! Add a modifier to only allow this function to be called by the VRFCoordinator
////     * @dev This is where you do something with randomness!
////     * @dev The VRF Coordinator will only send this function verified responses.
////     * @dev The VRF Coordinator will not pass randomness that could not be verified.
////     */
////  function fulfillRandomness(bytes32 requestId, uint256 randomness) external override onlyVRFCoordinator {
////    uint256 primeCandidate = randomness | (1 << 255) | 1;
////    if (_isMillerRabinPassed(primeCandidate)) {
////      randomResult = randomness;
////      return;
////    }
////    generateLargePrime();
////  }
////
////  /**
////   * @notice Modifier to only allow updates by the VRFCoordinator contract
////     */
////  modifier onlyVRFCoordinator {
////    require(msg.sender == vrfCoordinator, 'Fulfillment only allowed by VRFCoordinator');
////    _;
////  }
////
////  /*
////   * Run 20 iterations of Rabin Miller Primality test
////   */
////  function _isMillerRabinPassed(uint256 millerRabinCandidate) private returns (bool) {
////
////    uint256 maxDivisionsByTwo = 0;
////    uint256 evenComponent = millerRabinCandidate - 1;
////
////    while (evenComponent & 1 == 0) {
////      maxDivisionsByTwo += 1;
////      evenComponent >>= 1;
////    }
////
////    uint256 numberOfRabinTrials = 128;
////    for (uint256 i = 0; i < numberOfRabinTrials ; i++) {
////      uint256 roundTester = Math.random() * (millerRabinCandidate - 2) + 2;
////
////      if (_trialComposite(roundTester, evenComponent, millerRabinCandidate, maxDivisionsByTwo))
////        return false;
////    }
////    return true;
////  }
////
////  function _trialComposite(
////      uint256 roundTester,
////      uint256 evenComponent,
////      uint256 millerRabinCandidate,
////      uint256 maxDivisionsByTwo) private returns (bool) {
////    uint256 x = _expmod(roundTester, evenComponent, millerRabinCandidate);
////    if (x == 1 || x == millerRabinCandidate - 1) {
////      return false;
////    }
////
////    for (uint256 i = 0; i < maxDivisionsByTwo; i++) {
////      x = _expmod(roundTester, evenComponent, millerRabinCandidate);
////      if (_expmod(roundTester, 2**i * evenComponent, millerRabinCandidate) == millerRabinCandidate - 1) {
////        return false;
////      }
////    }
////    return true;
////  }
////
////  /*
////   * This function calculates (base ^ exp) % mod
////   */
////  function _expmod(uint256 base, uint256 exp, uint256 mod) private returns (uint256) {
////    if (exp == 0) return 1;
////    if (exp % 2 == 0) {
////      return (_expmod(base, (exp / 2), mod) ** 2) % mod;
////    } else {
////      return (base * _expmod( base, (exp - 1), mod)) % mod;
////    }
////  }
//}
