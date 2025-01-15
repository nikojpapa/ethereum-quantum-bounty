import {
  PrimeFactoringBountyWithPredeterminedLocks,
  PrimeFactoringBountyWithPredeterminedLocks__factory
} from '../../../../typechain'
import { bytes } from '../../../solidityTypes'
import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { arrayify } from 'ethers/lib/utils'
import { submitSolution } from '../../bounty-utils'

export function costOfSolvingPrimesFactory (
  keyBytesPerPrime: number,
  knownPrimeFactors: BigNumber[],
  expectedGasAll: number,
  expectedGasOne: number) {
  return () => {
    describe.skip('Test the cost of solving the prime factoring bounty', () => {
      let bounty: PrimeFactoringBountyWithPredeterminedLocks
      let solutions: bytes[][]
      let gasUsed: BigNumber

      async function deployBounty (locks: bytes[]): Promise<PrimeFactoringBountyWithPredeterminedLocks> {
        const ethersSigner = ethers.provider.getSigner()
        const bounty = await new PrimeFactoringBountyWithPredeterminedLocks__factory(ethersSigner).deploy(locks.length)
        for (let i = 0; i < locks.length; i++) {
          await bounty.setLock(i, locks[i])
        }
        return bounty
      }

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
        const solutionsPerLock = knownPrimeFactors.map(x => Buffer.from(arrayify(x.toHexString())))
        solutions = locks.map(() => solutionsPerLock)

        bounty = await deployBounty(locks)
      })

      it('should find the gas cost to solve all locks', async () => {
        for (let i = 0; i < solutions.length; i++) {
          const tx = await submitSolution(i, solutions[i], bounty)
          const receipt = await tx.wait()
          gasUsed = gasUsed.add(receipt.gasUsed)
        }
        expect(gasUsed).to.equal(BigNumber.from(expectedGasAll))
      })

      it('should find the gas cost to solve 1 lock', async () => {
        const arbitraryLockNumber = 0
        const tx = await submitSolution(arbitraryLockNumber, solutions[arbitraryLockNumber], bounty)
        const receipt = await tx.wait()
        gasUsed = gasUsed.add(receipt.gasUsed)
        expect(gasUsed).to.equal(BigNumber.from(expectedGasOne))
      })
    })
  }
}
