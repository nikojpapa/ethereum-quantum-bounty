import "./MillerRabin.sol";

contract MillerRabinTestHelper {
  function isPrime(bytes memory primeCandidate) public view returns (bool) {
    return MillerRabin.isPrime(primeCandidate);
  }
}
