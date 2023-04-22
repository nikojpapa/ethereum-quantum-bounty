interface BountyContract {
  bytes[] public locks;
  bool public solved;

  modifier requireUnsolved() {
    require(!solved, 'Already solved');
    _;
  }

  function widthdraw() public requireUnsolved {
    require(_verifySolutions(message, signatures), 'Invalid solution');
    solved = true;
    _sendBountyToSolver();
  }

  function _verifySolutions(bytes[][] memory signatures) private view virtual returns (bool) {
    return false;
  }

  function _sendBountyToSolver() private {
    Address.sendValue(payable(msg.sender), bounty());
  }

  function bounty() public view returns (uint256) {
    return address(this).balance;
  }

  receive() external payable {
    addToBounty();
  }

  fallback() external payable {
    addToBounty();
  }

  function addToBounty() public payable requireUnsolved {
  }
}
