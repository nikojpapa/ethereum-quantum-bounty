//// SPDX-License-Identifier: GPL-3.0
//pragma solidity ^0.8.12;
//
//import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
//import "../BountyContract.sol";
//
//contract SignatureBounty is BountyContract {
//    using ECDSA for bytes32;
//
//    function _verifySolutions(bytes[][] memory solutions) internal view override returns (bool) {
//        for (uint256 i = 0; i < locks.length; i++) {
//            address lock = locks[i];
//            bytes[] memory lockSolutions = solutions[i];
//            bytes32 message = lockSolutions[0];
//            bytes memory signature = lockSolutions[1];
//            bytes memory signature = signatures[i];
//            if (_getSignerAddress(message, signature) != lock) return false;
//        }
//        return true;
//    }
//}
