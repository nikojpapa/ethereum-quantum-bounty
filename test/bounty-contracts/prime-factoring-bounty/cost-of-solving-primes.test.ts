import { bytes } from '../../solidityTypes'
import {
  PrimeFactoringBountyWithPredeterminedLocks,
  PrimeFactoringBountyWithPredeterminedLocks__factory
} from '../../../typechain'
import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'
import PrimeFactoringBountyWithPredeterminedLocksUtils
  from './prime-factoring-bounty-with-predetermined-locks/prime-factoring-bounty-with-predetermined-locks-utils'
import { arrayify } from 'ethers/lib/utils'
import { expect } from 'chai'

describe('Test the cost of solving the prime factoring bounty', () => {
  it('should cost 5 wei to solve 120 locks of size 3072 bits', async () => {
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

    const numberOfBits = (lockOf3072BitsWithKnownDecomposition.toHexString().length - 2) * 4
    expect(numberOfBits).to.be.eq(bytesPerPrime * 8 * 3)

    const locks = new Array(numberOfLocks).fill(0).map(() => lockOf3072BitsWithKnownDecomposition.toHexString())
    const solutionsPerLock = primeFactors.map(x => Buffer.from(arrayify(x.toHexString())))
    const solutions = locks.map(() => solutionsPerLock)

    const bountyUtils = new PrimeFactoringBountyWithPredeterminedLocksUtils()
    const bounty = await deployBounty(locks)
    const tx = await bountyUtils.submitSolution(solutions, bounty)
    const receipt = await tx.wait()
    expect(receipt.gasUsed).to.eq(5)
  })
})
