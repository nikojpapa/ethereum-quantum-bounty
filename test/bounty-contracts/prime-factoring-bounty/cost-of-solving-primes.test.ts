import { bytes } from '../../solidityTypes'
import {
  BountyContract, GasCalculator,
  GasCalculator__factory,
  PrimeFactoringBountyWithPredeterminedLocks,
  PrimeFactoringBountyWithPredeterminedLocks__factory
} from '../../../typechain'
import { ethers } from 'hardhat'
import { BigNumber, ContractTransaction } from 'ethers'
import { arrayify } from 'ethers/lib/utils'
import { expect } from 'chai'
import { submitSolution } from '../bounty-utils'

describe('Test the cost of solving the prime factoring bounty', () => {
  const numberOfLocks = 119
  const bytesPerPrime = 128
  const ethersSigner = ethers.provider.getSigner()

  let bounty: PrimeFactoringBountyWithPredeterminedLocks
  let locks: string[]
  let solutions: bytes[][]

  async function deployBounty (locks: bytes[]): Promise<PrimeFactoringBountyWithPredeterminedLocks> {
    const bounty = await new PrimeFactoringBountyWithPredeterminedLocks__factory(ethersSigner).deploy(locks.length)
    for (let i = 0; i < locks.length; i++) {
      await bounty.setLock(i, locks[i])
    }
    return bounty
  }

  before(async () => {
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
    const bitsPerByte = 8
    const primeLengthMultiplierAsGivenInRsaUfoAlgorithm = 3
    expect(numberOfBits).to.be.eq(bytesPerPrime * bitsPerByte * primeLengthMultiplierAsGivenInRsaUfoAlgorithm)

    locks = new Array(numberOfLocks).fill(0).map(() => lockOf3072BitsWithKnownDecomposition.toHexString())
    const solutionsPerLock = primeFactors.map(x => Buffer.from(arrayify(x.toHexString())))
    solutions = locks.map(() => solutionsPerLock)
  })

  async function printMaxGasFromMultipleIterations (gasCalculator: (bounty: BountyContract) => Promise<BigNumber>, label: string): Promise<void> {
    const gasUseds: BigNumber[] = []
    let maxGasUsed = BigNumber.from(0)
    for (let j = 0; j < 10; j++) {
      bounty = await deployBounty(locks)
      const gasUsed = await gasCalculator(bounty)
      gasUseds.push(gasUsed)
      if (gasUsed.gt(maxGasUsed)) maxGasUsed = gasUsed

      console.log(`${label}: Gas used this iteration: ${gasUsed.toHexString()}`)
      console.log(`${label}: Max gas used: ${maxGasUsed.toHexString()}`)
    }
    const allGasString = gasUseds.map(x => x.toHexString()).join(', ')
    console.log(`${label}: Gas useds: ${allGasString}`)
    // fs.writeFile(`${label}-GAS_ESTIMATE.txt`, allGasString, err => {
    //   if (err != null) {
    //     console.error(err)
    //   }
    // })
  }

  it('should find the gas cost to solve all locks', async () => {
    const gasGetter = async (): Promise<BigNumber> => {
      let gasUsed = BigNumber.from(0)
      for (let i = 0; i < solutions.length; i++) {
        const tx = await submitSolution(i, solutions[i], bounty)
        const receipt = await tx.wait()
        gasUsed = gasUsed.add(receipt.gasUsed)
      }
      return gasUsed
    }
    await printMaxGasFromMultipleIterations(gasGetter, 'ALL_LOCKS')
  })

  it('should find the gas cost to solve 1 locks of size 3072 bits', async () => {
    const gasGetter = async (): Promise<BigNumber> => {
      const arbitraryLockNumber = 0
      const tx = await submitSolution(arbitraryLockNumber, solutions[arbitraryLockNumber], bounty)
      const receipt = await tx.wait()
      return receipt.gasUsed
    }
    await printMaxGasFromMultipleIterations(gasGetter, 'ONE_LOCK')
  })

  describe.only('pieces of solving a lock', () => {
    let gasCalculator: GasCalculator

    before(async () => {
      gasCalculator = await new GasCalculator__factory(ethersSigner).deploy()
    })

    async function printGas (tx: ContractTransaction, label: string): Promise<void> {
      const receipt = await tx.wait()
      console.log(`${label}-GAS:`, receipt.gasUsed.toHexString())
    }

    it('should find the gas cost of Miller-Rabin Primality Test', async () => {
      const tx = await gasCalculator.millerRabinOnMultipleNumbers(solutions[0])
      await printGas(tx, 'MILLER_RABIN')
    })

    it('should find the gas cost of multiplying numbers', async () => {
      const tx = await gasCalculator.multiplyNumbers(solutions[0])
      await printGas(tx, 'MULTIPLY')
    })

    it('should find the gas cost of comparing numbers', async () => {
      const tx = await gasCalculator.compareNumbers(locks[0], locks[0])
      await printGas(tx, 'COMPARE')
    })
  })
})
