// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Address.sol";

abstract contract BountyContract {
  bytes[] public locks;
  bool public solved;

  struct Commit {
    bytes32 solutionHash;
    uint commitTime;
  }
  mapping(address => Commit) private commits;

  modifier requireUnsolved() {
    require(!solved, 'Already solved');
    _;
  }

  function commitSolution(bytes32 solutionHash) public requireUnsolved {
    Commit storage commit = commits[msg.sender];
    commit.solutionHash = solutionHash;
    commit.commitTime = block.timestamp;
  }

  function getMyCommit() public view returns (bytes32, uint) {
    Commit storage commit = commits[msg.sender];
    require(commit.commitTime != 0, "Not committed yet");
    return (commit.solutionHash, commit.commitTime);
  }

  function widthdraw(bytes[][] memory solutions, string memory secret) public requireUnsolved {
    require(_verifyReveal(solutions, secret), "Solution hash doesn't match");
    require(_verifySolutions(solutions), 'Invalid solution');
    solved = true;
    _sendBountyToSolver();
  }

  function _verifyReveal(bytes[][] memory solutions, string memory secret) private view returns (bool) {
    Commit storage commit = commits[msg.sender];
    require(commit.commitTime != 0, 'Not committed yet');
    require(commit.commitTime < block.timestamp, 'Cannot reveal in the same block');

    bytes memory solutionEncoding = abi.encode(msg.sender, solutions, secret);
    bytes32 solutionHash = keccak256(solutionEncoding);
    return solutionHash == commit.solutionHash;
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
