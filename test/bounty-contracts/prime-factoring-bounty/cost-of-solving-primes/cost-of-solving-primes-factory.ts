import {
  PrimeFactoringBountyWithPredeterminedLocks
} from '../../../../typechain'
import { bytes } from '../../../solidityTypes'
import { BigNumber } from 'ethers'
import { expect } from 'chai'
import { submitSolution } from '../../bounty-utils'
import PrimeFactoringBountyWithPredeterminedLocksUtils
  from '../prime-factoring-bounty-with-predetermined-locks/prime-factoring-bounty-with-predetermined-locks-utils'

export function costOfSolvingPrimesFactory (keyBytesPerPrime: number, knownPrimeFactors: BigNumber[]) {
  return () => {
    let bounty: PrimeFactoringBountyWithPredeterminedLocks
    let bountyUtils: PrimeFactoringBountyWithPredeterminedLocksUtils
    let solutions: bytes[]
    let gasUsed: BigNumber

    beforeEach(async () => {
      const numberOfLocks = 119
      gasUsed = BigNumber.from(0)

      let lockWithKnownDecomposition = BigNumber.from(1)
      for (const num of knownPrimeFactors) {
        lockWithKnownDecomposition = lockWithKnownDecomposition.mul(num)
      }

      const numberOfBits = (lockWithKnownDecomposition.toHexString().length - 2) * 4
      expect(numberOfBits).to.be.eq(keyBytesPerPrime * 8 * 3)

      const locks = new Array(numberOfLocks).fill(0).map(() => lockWithKnownDecomposition.toHexString())
      const locksAndKeys = locks.map(lock => {
        return {
          lock: lock,
          keys: knownPrimeFactors.map(primeFactor => primeFactor.toHexString())
        }
      })
      bountyUtils = new PrimeFactoringBountyWithPredeterminedLocksUtils(locksAndKeys)
      bounty = await bountyUtils.deployBounty()
      console.log(`Lock: ${await bounty.getLock(0)}`)
      solutions = bountyUtils.getSolutions()
    })

    it('should find the gas cost to solve all locks', async () => {
      for (let i = 0; i < solutions.length; i++) {
        const tx = await submitSolution(i, solutions[i], bounty)
        const receipt = await tx.wait()
        gasUsed = gasUsed.add(receipt.gasUsed)
      }
      console.log(`Gas used solving all locks: ${gasUsed.toHexString()}`)
    })

    it('should find the gas cost to solve 1 lock', async () => {
      const arbitraryLockNumber = 0
      const tx = await submitSolution(arbitraryLockNumber, solutions[arbitraryLockNumber], bounty)
      const receipt = await tx.wait()
      gasUsed = gasUsed.add(receipt.gasUsed)
      console.log(`Gas used solving one lock: ${gasUsed.toHexString()}`)
    })
  }
}
