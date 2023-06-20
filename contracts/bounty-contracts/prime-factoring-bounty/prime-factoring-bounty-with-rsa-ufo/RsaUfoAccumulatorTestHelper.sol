import "./RsaUfoAccumulator.sol";

contract RsaUfoAccumulatorTestHelper is RsaUfoAccumulator {
  constructor(uint256 numberOfLocksInit, uint256 bytesPerPrimeInit)
    RsaUfoAccumulator(numberOfLocksInit, bytesPerPrimeInit) {}

  function triggerAccumulate(bytes memory randomBytes) public {
    accumulate(randomBytes);
  }
}
