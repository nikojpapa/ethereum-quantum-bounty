// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Address.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

abstract contract BountyContract {
  bytes[][] public locks;
  bool[] public lockSolvedStatus;
  bool public solved;
  uint256 public numberOfLocks;

  struct Commit {
    bytes solutionHash;
    uint256 timestamp;
  }
  mapping(address => mapping(uint256 => Commit)) private commits;
  uint256 private ONE_DAY_IN_SECONDS = 86400;

  constructor(uint256 numberOfLocksInit) {
    numberOfLocks = numberOfLocksInit;
    locks = new bytes[][](numberOfLocks);
    lockSolvedStatus = new bool[](numberOfLocks);
  }

  modifier requireUnsolved() {
    require(!solved, 'Already solved');
    _;
  }

  function getLockValue(uint256 lockNumber) internal view returns (bytes[] memory) {
    return locks[lockNumber];
  }

  function commitSolution(uint256 lockNumber, bytes memory solutionHash) public requireUnsolved {
    Commit storage commit = commits[msg.sender][lockNumber];
    commit.solutionHash = solutionHash;
    commit.timestamp = block.timestamp;
  }

  function getMyCommit(uint256 lockNumber) public view returns (bytes memory, uint256) {
    Commit storage commit = commits[msg.sender][lockNumber];
    _requireCommitExists(commit);
    return (commit.solutionHash, commit.timestamp);
  }

  function solve(uint256 lockNumber, bytes[] memory solution) public requireUnsolved {
    require(_verifyReveal(lockNumber, solution), "Solution hash doesn't match");
    require(_verifySolution(lockNumber, solution), 'Invalid solution');

    lockSolvedStatus[lockNumber] = true;
    if (_allLocksSolved()) {
      solved = true;
      _sendBountyToSolver();
    }
  }

  function _verifyReveal(uint256 lockNumber, bytes[] memory solution) private view returns (bool) {
    Commit storage commit = commits[msg.sender][lockNumber];
    _requireCommitExists(commit);
    require(block.timestamp - commit.timestamp >= ONE_DAY_IN_SECONDS, 'Cannot reveal within a day of the commit');

    bytes memory solutionEncoding = abi.encode(msg.sender, solution);
    bytes32 solutionHash = keccak256(solutionEncoding);
    return BytesLib.equal(abi.encodePacked(solutionHash), commit.solutionHash);
  }

  function _requireCommitExists(Commit memory commit) private pure {
    require(!BytesLib.equal(commit.solutionHash, ""), 'Not committed yet');
  }

  function _verifySolution(uint256 lockNumber, bytes[] memory solution) internal view virtual returns (bool);

  function _allLocksSolved() private view returns (bool) {
    bool allSolved = true;
    for (uint256 lockNumber = 0; lockNumber < lockSolvedStatus.length; lockNumber++) {
      if (!lockSolvedStatus[lockNumber]) {
        allSolved = false;
        break;
      }
    }
    return allSolved;
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
