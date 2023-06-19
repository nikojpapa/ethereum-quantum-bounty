import {
  PrimeFactoringBountyWithPredeterminedLocks, PrimeFactoringBountyWithPredeterminedLocks__factory
} from '../typechain'
import { ethers } from 'hardhat'
import { bytes } from '../test/solidityTypes'
import PrimeFactoringBountyWithPredeterminedLocksUtils
  from '../test/bounty-contracts/prime-factoring-bounty/prime-factoring-bounty-with-predetermined-locks/prime-factoring-bounty-with-predetermined-locks-utils'
import { BigNumber } from 'ethers'

const numberOfLocks = 120
const bytesPerPrime = 128

async function deployBounty (locks: bytes[]): Promise<PrimeFactoringBountyWithPredeterminedLocks> {
  const ethersSigner = ethers.provider.getSigner()
  return await new PrimeFactoringBountyWithPredeterminedLocks__factory(ethersSigner).deploy(locks)
}

const primesOf100 = [
  BigNumber.from(2),
  BigNumber.from(2),
  BigNumber.from(5),
  BigNumber.from(5)
]
const primeFactors = primesOf100
const primesThatGoIntoLockThreeTimes = [
  BigNumber.from('0x9deb56589d3dbc359f4d7ad556cd6114e6e0d5d380d45aff59fe564fe2d0c7e7'),
  BigNumber.from('0xb237e0a87baa96360e7faa432a40fd550cea247ad83198a08674b6af0c8aab1f'),
  BigNumber.from('0x98b506e93598a98579c9ce06a99d65d5a7694d9d739c270d5fa04abb4518af7b'),
  BigNumber.from('0xcc3422fbc329d582d216c4b4b879e4873a155864d9e95e6722136ac94c3fdb21')
]
for (const num of primesThatGoIntoLockThreeTimes) {
  for (let i = 0; i < 3; i++) primeFactors.push(num)
}

let lockOf3072BitsWithKnownDecomposition = BigNumber.from(1)
for (const num of primeFactors) {
  lockOf3072BitsWithKnownDecomposition = lockOf3072BitsWithKnownDecomposition.mul(num)
}

if (lockOf3072BitsWithKnownDecomposition.toHexString().length !== 3 * bytesPerPrime) {
  throw new Error(`Lock is an incorrect size. The size is ${lockOf3072BitsWithKnownDecomposition.toHexString().length} but should be ${3 * bytesPerPrime}`)
}

const locks = new Array(numberOfLocks).fill(0).map(() => lockOf3072BitsWithKnownDecomposition.toHexString())

const bountyUtils = new PrimeFactoringBountyWithPredeterminedLocksUtils()
const bounty = await deployBounty(locks)
bountyUtils.submitSolution(primeFactors.map(x => x.toHexString()), bounty)
