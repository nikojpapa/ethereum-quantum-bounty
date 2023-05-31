// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Address.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

abstract contract BountyContract {
  bytes[] public locks;
  bool public solved;

  struct Commit {
    bytes solutionHash;
    uint256 block;
  }
  mapping(address => Commit) private commits;

  modifier requireUnsolved() {
    require(!solved, 'Already solved');
    _;
  }

  function commitSolution(bytes memory solutionHash) public requireUnsolved {
    Commit storage commit = commits[msg.sender];
    commit.solutionHash = solutionHash;
    commit.block = block.number;
  }

  function getMyCommit() public view returns (bytes memory, uint256) {
    Commit storage commit = commits[msg.sender];
    _requireCommitExists(commit);
    return (commit.solutionHash, commit.block);
  }

  function widthdraw(bytes[][] memory solutions) public requireUnsolved {
    require(_verifyReveal(solutions), "Solution hash doesn't match");
    require(_verifySolutions(solutions), 'Invalid solution');
    solved = true;
    _sendBountyToSolver();
  }

  function _verifyReveal(bytes[][] memory solutions) private view returns (bool) {
    Commit storage commit = commits[msg.sender];
    _requireCommitExists(commit);
    require(commit.block < block.number, 'Cannot reveal in the same block');

    bytes memory solutionEncoding = abi.encode(msg.sender, solutions);
    bytes32 solutionHash = keccak256(solutionEncoding);
    return BytesLib.equal(abi.encodePacked(solutionHash), commit.solutionHash);
  }

  function _requireCommitExists(Commit memory commit) private pure {
    require(!BytesLib.equal(commit.solutionHash, ""), 'Not committed yet');
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
