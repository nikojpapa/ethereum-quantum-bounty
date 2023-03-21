// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "./BountyFallbackAccount.sol";

contract BountyFallbackAccountFactory {
    BountyFallbackAccount public immutable accountImplementation;

    constructor(IEntryPoint _entryPoint) {
        accountImplementation = new BountyFallbackAccount(_entryPoint);
    }

    function createAccount(address owner,uint256 salt) public returns (BountyFallbackAccount ret) {
        address addr = getAddress(owner, salt);
        uint codeSize = addr.code.length;
        if (codeSize > 0) {
            return BountyFallbackAccount(payable(addr));
        }
        ret = BountyFallbackAccount(payable(new ERC1967Proxy{salt : bytes32(salt)}(
                address(accountImplementation),
                abi.encodeCall(BountyFallbackAccount.initialize, (owner))
            )));
    }

    function getAddress(address owner,uint256 salt) public view returns (address) {
        return Create2.computeAddress(bytes32(salt), keccak256(abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(accountImplementation),
                    abi.encodeCall(BountyFallbackAccount.initialize, (owner))
                )
            )));
    }
}
