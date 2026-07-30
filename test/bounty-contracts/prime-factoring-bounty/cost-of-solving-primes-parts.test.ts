import { bytes } from '../../solidityTypes'
import {
  GasCalculator,
  GasCalculator__factory,
  PrimeFactoringBountyWithRsaUfo__factory,
  RandomBytesAccumulatorTestHelper__factory
} from '../../../typechain'
import { ethers } from 'hardhat'
import { BigNumber, ContractTransaction } from 'ethers'
import { arrayify } from 'ethers/lib/utils'
import { randomBytes } from 'crypto'

const BITS_PER_BYTE = 8

describe('Test the gas of parts of solving/deploying the prime factoring bounty', () => {
  const numberOfLocks = 119
  const bytesPerPrime = 128
  const ethersSigner = ethers.provider.getSigner()

  let lock: string
  let solution: bytes[]

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

    lock = lockOf3072BitsWithKnownDecomposition.toHexString()
    solution = primeFactors.map(x => Buffer.from(arrayify(x.toHexString())))
  })

  describe('parts of each process', () => {
    let gasCalculator: GasCalculator

    before(async () => {
      gasCalculator = await new GasCalculator__factory(ethersSigner).deploy()
    })

    async function printGas (tx: ContractTransaction, label: string): Promise<void> {
      const receipt = await tx.wait()
      console.log(`${label}-GAS:`, receipt.gasUsed.toHexString())
    }

    describe('parts of solving a lock', () => {
      it('should find the gas of Miller-Rabin Primality Test', async () => {
        const tx = await gasCalculator.millerRabinOnMultipleNumbers(solution)
        await printGas(tx, 'MILLER_RABIN')
      })

      it('should find the gas of multiplying numbers', async () => {
        const tx = await gasCalculator.multiplyNumbers(solution)
        await printGas(tx, 'MULTIPLY')
      })

      it('should find the gas of comparing numbers', async () => {
        const tx = await gasCalculator.compareNumbers(lock, lock)
        await printGas(tx, 'COMPARE')
      })
    })

    describe('parts of deploying', () => {
      it('should find the gas of making a single generation trigger call', async () => {
        const bounty = await new PrimeFactoringBountyWithRsaUfo__factory(ethersSigner)
          .deploy(numberOfLocks, bytesPerPrime)
        const tx = await bounty.triggerLockAccumulation()
        await printGas(tx, 'SINGLE_ACCUMULATION_TRIGGER')
      })

      it('should find the gas of generating a random number', async () => {
        const tx = await gasCalculator.generateRandomBytes()
        await printGas(tx, 'RANDOM_NUMBER')
      })

      it('should find the gas of accumulating a number', async () => {
        const accumulator = await new RandomBytesAccumulatorTestHelper__factory(ethersSigner)
          .deploy(numberOfLocks, bytesPerPrime)
        const bitsPerKeccak = 256
        const tx = await accumulator.triggerAccumulate(randomBytes(bitsPerKeccak / BITS_PER_BYTE))
        await printGas(tx, 'ACCUMULATE')
      })
    })
  })
})
