// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

////From https://gist.github.com/HarryR/0520edbd653664917525fb64b5d2a74f
//library MillerRabin
//{
//  function modexp_rsa2048(uint256[8] memory b, uint256 e)
//  public view returns(uint256[8] memory result)
//  {
//    bool success;
//    assembly {
//      let freemem := mload(0x40)
//
//    // Length of base, exponent and modulus
//      mstore(freemem, 0x100)              // base     (2048)
//      mstore(add(freemem,0x20), 0x20)     // exponent (256)
//      mstore(add(freemem,0x40), 0x100)    // modulus  (2048)
//
//    // 2048bit base
//      success := staticcall(sub(gas(), 2000), 4, b, 0x100, add(freemem,0x60), 0x100)
//
//    // 256bit exponent
//      mstore(add(freemem,0x160), e)
//
//    // Hard-coded RSA-2048 modulus
//      mstore(add(freemem,0x180), 0xc7970ceedcc3b0754490201a7aa613cd73911081c790f5f1a8726f463550bb5b)
//      mstore(add(freemem,0x1A0), 0x7ff0db8e1ea1189ec72f93d1650011bd721aeeacc2acde32a04107f0648c2813)
//      mstore(add(freemem,0x1C0), 0xa31f5b0b7765ff8b44b4b6ffc93384b646eb09c7cf5e8592d40ea33c80039f35)
//      mstore(add(freemem,0x1E0), 0xb4f14a04b51f7bfd781be4d1673164ba8eb991c2c4d730bbbe35f592bdef524a)
//      mstore(add(freemem,0x200), 0xf7e8daefd26c66fc02c479af89d64d373f442709439de66ceb955f3ea37d5159)
//      mstore(add(freemem,0x220), 0xf6135809f85334b5cb1813addc80cd05609f10ac6a95ad65872c909525bdad32)
//      mstore(add(freemem,0x240), 0xbc729592642920f24c61dc5b3c3b7923e56b16a4d9d373d8721f24a3fc0f1b31)
//      mstore(add(freemem,0x260), 0x31f55615172866bccc30f95054c824e733a5eb6817f7bc16399d48c6361cc7e5)
//
//      success := staticcall(sub(gas(), 2000), 0x0000000000000000000000000000000000000005, freemem, 0x280, result, 0x100)
//    }
//    require( success );
//  }
//
//  function modexp(uint256 b, uint256 e, uint256 m)
//  public view returns(uint256 result)
//  {
//    bool success;
//    assembly {
//      let freemem := mload(0x40)
//      mstore(freemem, 0x20)
//      mstore(add(freemem,0x20), 0x20)
//      mstore(add(freemem,0x40), 0x20)
//      mstore(add(freemem,0x60), b)
//      mstore(add(freemem,0x80), e)
//      mstore(add(freemem,0xA0), m)
//      success := staticcall(39240, 5, freemem, 0xC0, freemem, 0x20)
//      result := mload(freemem)
//    }
//    require(success);
//  }
//
//  function isPrime(uint256 n)
//  public view returns (bool)
//  {
//    uint32 k = 128;
//    if(n == 2)
//      return true;
//
//    if( n < 2 || n % 2 == 0 )
//      return false;
//
//    uint256 d = n - 1;
//    uint256 s = 0;
//
//    while( d % 2 == 0 ) {
//      d = d / 2;
//      s += 1;
//    }
//
//    while( k-- != 0 ) {
//      uint256 entropy = randMod(n, k);
//      uint256 x = modexp(entropy, d, n);
//      if (x == 1 || x == n-1)
//        continue;
//
//      bool ok = false;
//
//      for( uint j = 1; j < s; j++ ) {
//        x = mulmod(x, x, n);
//        if( x == 1 )
//          return false;
//        if(x == n-1) {
//          ok = true;
//          break;
//        }
//      }
//      if ( false == ok ) {
//        return false;
//      }
//    }
//    return true;
//  }
//
//  function randMod(uint256 modulus, uint256 randNonce) private view returns (uint256) {
//    // from https://www.geeksforgeeks.org/random-number-generator-in-solidity-using-keccak256/
//    return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce))) % modulus;
//  }
//}

//import "@openzeppelin/contracts/utils/Strings.sol";
//import "solidity-bytes-utils/contracts/BytesLib.sol";
//
//import "./utils/BigNumbers.sol";
//
//// Adapted from https://medium.com/@ntnprdhmm/how-to-generate-big-prime-numbers-miller-rabin-49e6e6af32fb
//library MillerRabin {
//  using BigNumbers for *;
//
//  function isPrime(uint256 millerRabinCandidate) public view returns (bool) {
//    if (millerRabinCandidate == 2 || millerRabinCandidate == 3) return true;
//    if (millerRabinCandidate <= 1 || millerRabinCandidate & 1 == 0) return false;
//
//    uint256 maxDivisionsByTwo = 0;
//    uint256 evenComponent = millerRabinCandidate - 1;
//
//    while (evenComponent & 1 == 0) {
//      maxDivisionsByTwo += 1;
//      evenComponent >>= 1;
//    }
//
//    uint256 numberOfTrials = 128;
//    for (uint256 i = 0; i < numberOfTrials ; i++) {
//      uint256 roundTester = randMod(millerRabinCandidate - 2, i) + 2;
//
////      BigNumber memory bn = roundTester.init(false);
////      uint msword;
////      bytes memory val = bn.val;
////      assembly {msword := mload(add(val,0x20))} //get msword of result
////      if(msword==0) require(bn.isZero());
////      else require((msword>>((bn.bitlen%256)-1)==1));
////
//////      require(false, string.concat('num: ', Strings.toString(BytesLib.toUint256(abi.encodePacked(roundTester), 0))));
//////      require(false, string.concat('num: ', Strings.toString(BytesLib.toUint256(abi.encodePacked(roundTester).init(false).val, 0))));
//////      roundTester.init(false).verify();
////      return true;
//
//      BigNumber memory x = _expmod(roundTester.init(false), evenComponent, millerRabinCandidate);
//      if (!x.eq(BigNumbers.one()) && !x.eq((millerRabinCandidate - 1).init(false))) {
//        uint256 j = 1;
//        while (j < maxDivisionsByTwo && !x.eq((millerRabinCandidate - 1).init(false))) {
//          x = _expmod(x, 2, millerRabinCandidate);
//          if (x.eq(BigNumbers.one())) return false;
//          j += 1;
//        }
//        if (!x.eq((millerRabinCandidate - 1).init(false))) return false;
//      }
//
////      bool isComposite = _trialComposite(roundTester, evenComponent, millerRabinCandidate, maxDivisionsByTwo);
////      if (isComposite) return false;
//    }
//    return true;
//  }
//
//  function randMod(uint256 modulus, uint256 randNonce) private view returns (uint256)
//  {
//    // from https://www.geeksforgeeks.org/random-number-generator-in-solidity-using-keccak256/
//    return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce))) % modulus;
//  }
//
//  function _expmod(BigNumber memory base, uint256 exp, uint256 mod)
//  private view returns (BigNumber memory)
//  {
////    base.verify();
//    BigNumber memory x = base.modexp(exp.init(false), mod.init(false));
//    return base.modexp(exp.init(false), mod.init(false));
//    //    if (exp == 0) return 1;
//    //    if (exp % 2 == 0) {
//    //      return (_expmod(base, (exp / 2), mod) ** 2) % mod;
//    //    } else {
//    //      return (base * _expmod( base, (exp - 1), mod)) % mod;
//    //    }
//  }
//
////  function _trialComposite(
////    uint256 roundTester,
////    uint256 evenComponent,
////    uint256 millerRabinCandidate,
////    uint256 maxDivisionsByTwo) private view returns (bool)
////  {
////    BigNumber memory x = _expmod(roundTester.init(false), evenComponent, millerRabinCandidate);
////    if (x.eq(BigNumbers.one()) || x.eq((millerRabinCandidate - 1).init(false))) return true;
////
////    uint256 j = 1;
////    while (j < maxDivisionsByTwo && !x.eq((millerRabinCandidate - 1).init(false))) {
////      x = _expmod(x, 2, millerRabinCandidate);
////      if (x.eq(BigNumbers.one())) return true;
////      j += 1;
////    }
////    return !x.eq((millerRabinCandidate - 1).init(false));
////  }
//}

import "@openzeppelin/contracts/utils/Strings.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "./BigNumbers.sol";

library MillerRabin {
  using BigNumbers for *;

  //From https://github.com/firoorg/solidity-BigNumber/blob/master/src/utils/Crypto.sol
  function isPrime(bytes memory primeCandidate) public view returns (bool){
    BigNumber memory a = primeCandidate.init(false);

    BigNumber memory one = BigNumbers.one();
    BigNumber memory two = BigNumbers.two();

    int compare = a.cmp(two,true);
    if (compare < 0){
      // if value is < 2
      return false;
    }
    if(compare == 0){
      // if value is 2
      return true;
    }
    // if a is even and not 2 (checked): return false
    if (!a.isOdd()) {
      return false;
    }

    BigNumber memory a1 = a.sub(one);

    uint k = getK(a1);
    BigNumber memory a1_odd = a1.val.init(a1.neg);
    a1_odd._shr(k);

    int j;
    uint num_checks = primeChecksForSize(a.bitlen);
    BigNumber memory check;
    for (uint i = 0; i < num_checks; i++) {

      BigNumber memory randomness = randMod(a1, i);
      check = randomness.add(one);
      // now 1 <= check < a.

      j = witness(check, a, a1, a1_odd, k);

      if(j==-1 || j==1) return false;
    }

    //if we've got to here, a is likely a prime.
    return true;
  }

  function getK(
    BigNumber memory a1
  ) private pure returns (uint k){
    k = 0;
    uint mask=1;
    uint a1_ptr;
    uint val;
    assembly{
      a1_ptr := add(mload(a1),mload(mload(a1))) // get address of least significant portion of a
      val := mload(a1_ptr)  //load it
    }

    //loop from least signifcant bits until we hit a set bit. increment k until this point.
    for(bool bit_set = ((val & mask) != 0); !bit_set; bit_set = ((val & mask) != 0)){

      if(((k+1) % 256) == 0){ //get next word should k reach 256.
        a1_ptr -= 32;
        assembly {val := mload(a1_ptr)}
        mask = 1;
      }

      mask*=2; // set next bit (left shift)
      k++;     // increment k
    }
  }

  function primeChecksForSize(
    uint bit_size
  ) private pure returns(uint checks){

    checks = bit_size >= 1300 ?  2 :
    bit_size >=  850 ?  3 :
    bit_size >=  650 ?  4 :
    bit_size >=  550 ?  5 :
    bit_size >=  450 ?  6 :
    bit_size >=  400 ?  7 :
    bit_size >=  350 ?  8 :
    bit_size >=  300 ?  9 :
    bit_size >=  250 ? 12 :
    bit_size >=  200 ? 15 :
    bit_size >=  150 ? 18 :
    /* b >= 100 */ 27;
  }

  function randMod(BigNumber memory modulus, uint256 randNonce) private view returns (BigNumber memory) {
    // from https://www.geeksforgeeks.org/random-number-generator-in-solidity-using-keccak256/
    uint256 unmodded = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce)));
    return unmodded.init(false).mod(modulus);
  }

  function witness(
    BigNumber memory w,
    BigNumber memory a,
    BigNumber memory a1,
    BigNumber memory a1_odd,
    uint k
  ) private view returns (int){
    BigNumber memory one = BigNumbers.one();
    BigNumber memory two = BigNumbers.two();
    // returns -  0: likely prime, 1: composite number (definite non-prime).

    w = w.modexp(a1_odd, a); // w := w^a1_odd mod a

    if (w.cmp(one,true)==0) return 0; // probably prime.

    if (w.cmp(a1,true)==0) return 0; // w == -1 (mod a), 'a' is probably prime

    for (;k != 0; k=k-1) {
      w = w.modexp(two,a); // w := w^2 mod a

      if (w.cmp(one,true)==0) return 1; // // 'a' is composite, otherwise a previous 'w' would have been == -1 (mod 'a')

      if (w.cmp(a1,true)==0) return 0; // w == -1 (mod a), 'a' is probably prime

    }
    /*
     * If we get here, 'w' is the (a-1)/2-th power of the original 'w', and
     * it is neither -1 nor +1 -- so 'a' cannot be prime
     */
    return 1;
  }
}
