import { BigNumber } from 'ethers'
import { costOfSolvingPrimesFactory } from './cost-of-solving-primes/utilities'

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

describe.skip(
  'Test the cost of solving the prime factoring bounty with 3072-bit key',
  costOfSolvingPrimesFactory(128, primeFactors, 0x1b2befab, 0x4b423d)
)
