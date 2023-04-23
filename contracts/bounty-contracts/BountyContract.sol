// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Address.sol";

abstract contract BountyContract {
  bytes[] public locks;
  bool public solved;

  modifier requireUnsolved() {
    require(!solved, 'Already solved');
    _;
  }

  function widthdraw(bytes[][] memory solutions) public requireUnsolved {
    require(_verifySolutions(solutions), 'Invalid solution');
    solved = true;
    _sendBountyToSolver();
  }

  function _verifySolutions(bytes[][] memory solutions) internal view virtual returns (bool);

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
