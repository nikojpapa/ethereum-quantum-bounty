// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Address.sol";
import "./LocksManager.sol";
import "./CommitRevealManager.sol";

abstract contract BountyContract {
  bool public solved;

  LockManager internal lockManager;
  CommitRevealManager private commitRevealManager;

  uint256 internal numberOfLocksInit;
  constructor(uint256 numberOfLocksInitArg) {
    numberOfLocksInit = numberOfLocksInitArg;
    commitRevealManager = new CommitRevealManager();
  }

  modifier requireUnsolved() {
    require(!solved, 'Already solved');
    _;
  }

  function init() public virtual {
    lockManager = new LockManager(numberOfLocksInit);
  }

  function _verifySolution(uint256 lockNumber, bytes memory solution) internal view virtual returns (bool);

  function getLock(uint256 lockNumber) public view returns (bytes[] memory) {
    return lockManager.getLock(lockNumber);
  }

  function numberOfLocks() public view returns (uint256) {
    return lockManager.numberOfLocks();
  }

  function commitSolution(uint256 lockNumber, bytes memory solutionHash) public requireUnsolved {
    commitRevealManager.commitSolution(msg.sender, lockNumber, solutionHash);
  }

  function getMyCommit(uint256 lockNumber) public view returns (bytes memory, uint256) {
    return commitRevealManager.getMyCommit(msg.sender, lockNumber);
  }

  function solve(uint256 lockNumber, bytes memory solution) public requireUnsolved {
    require(commitRevealManager.verifyReveal(msg.sender, lockNumber, solution), "Solution hash doesn't match");
    require(_verifySolution(lockNumber, solution), 'Invalid solution');

    lockManager.setLocksSolvedStatus(true, lockNumber);
    if (lockManager.allLocksSolved()) {
      solved = true;
      _sendBountyToSolver();
    }
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
