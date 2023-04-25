import { ethers } from 'hardhat'
import { RandomNumberAccumulator, RandomNumberAccumulator__factory } from '../../../../typechain'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { arrayify } from 'ethers/lib/utils'

describe('RandomNumberAccumulator', () => {
  const BYTES_PER_uint256 = 32
  const BITS_PER_BYTE = 8
  const HIGHER_GAS_LIMIT_OPTION = { gasLimit: BigNumber.from('0x1000000') }

  const ethersSigner = ethers.provider.getSigner()
  let randomNumberAccumulator: RandomNumberAccumulator

  const _256BitPrime = BigNumber.from(arrayify('0xc66f06e1b45c9c55073ed83708f390c86fd13e874d211d405abe0d293682ff03'))

  it('should not finish if the first random number is prime, but there are not enough bits', async () => {
    const numberOfLocks = 1
    const primesPerLock = 1
    const bytesPerPrime = BYTES_PER_uint256 + 1
    randomNumberAccumulator = await new RandomNumberAccumulator__factory(ethersSigner).deploy(numberOfLocks, primesPerLock, bytesPerPrime)

    await randomNumberAccumulator.accumulate(_256BitPrime)
    expect(await randomNumberAccumulator.isDone()).to.be.eq(false)
  })

  it('should set the first bit of the first number to 1', async () => {
    const numberOfLocks = 1
    const primesPerLock = 1
    const bytesPerPrime = BYTES_PER_uint256
    randomNumberAccumulator = await new RandomNumberAccumulator__factory(ethersSigner).deploy(numberOfLocks, primesPerLock, bytesPerPrime)

    const _256BitPrimeWithoutLeadingBit = _256BitPrime.mask(255)
    await randomNumberAccumulator.accumulate(_256BitPrimeWithoutLeadingBit)
    expect(await randomNumberAccumulator.isDone()).to.be.eq(true)
  })

  it('should not set the first bit to 1 after the first number', async () => {
    expect.fail()
  })

  it('should always set the last bit', async () => {
    expect.fail()
  })

  it('should append sequential numbers to reach the required bytes', async () => {
    const numberOfLocks = 1
    const primesPerLock = 1
    const bytesPerPrime = BYTES_PER_uint256 * 2
    randomNumberAccumulator = await new RandomNumberAccumulator__factory(ethersSigner).deploy(numberOfLocks, primesPerLock, bytesPerPrime)

    const _512BitPrime = BigNumber.from(arrayify('0xdf122aa1a14be816462ac30f4074c042e899276cfdf4f1c1943ba244edbc904a03faf637e7d554021160496e96dc35afc16758473036077af0ecda7290509a89'))
    const firstHalf = _512BitPrime.shr(BYTES_PER_uint256 * BITS_PER_BYTE)
    const secondHalf = _512BitPrime.mask(BYTES_PER_uint256 * BITS_PER_BYTE)
    await randomNumberAccumulator.accumulate(firstHalf, HIGHER_GAS_LIMIT_OPTION)
    expect(await randomNumberAccumulator.isDone()).to.be.eq(false)
    await randomNumberAccumulator.accumulate(secondHalf)
    expect(await randomNumberAccumulator.isDone()).to.be.eq(true)
  })

  it('should slice off extra bits', async () => {
    const numberOfLocks = 1
    const primesPerLock = 1
    const bytesPerPrime = 1
    randomNumberAccumulator = await new RandomNumberAccumulator__factory(ethersSigner).deploy(numberOfLocks, primesPerLock, bytesPerPrime)

    const oneBytePrime = 0xbf
    const remainingBits = (BYTES_PER_uint256 - bytesPerPrime) * BITS_PER_BYTE
    const primeWithAdditionalBitsThatMakeItComposite = BigNumber.from(oneBytePrime).shl(remainingBits)
    await randomNumberAccumulator.accumulate(primeWithAdditionalBitsThatMakeItComposite)
    expect(await randomNumberAccumulator.isDone()).to.be.eq(true)
  })

  describe('prime candidate chosen, but is not actually prime', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const primesPerLock = 1
      randomNumberAccumulator = await new RandomNumberAccumulator__factory(ethersSigner).deploy(numberOfLocks, primesPerLock, BYTES_PER_uint256)

      const arbitraryCompositeNumber = 1
      await randomNumberAccumulator.accumulate(arbitraryCompositeNumber)
    })

    it('should not be marked done', async () => {
      expect(await randomNumberAccumulator.isDone()).to.be.eq(false)
    })

    it('should reset for the next qubit', async () => {
      await randomNumberAccumulator.accumulate(_256BitPrime)
      expect(await randomNumberAccumulator.isDone()).to.be.eq(true)
    })
  })

  it('should use the first and last primes given a composite in between when requiring two primes and one lock', async () => {
    const numberOfLocks = 1
    const primesPerLock = 2
    randomNumberAccumulator = await new RandomNumberAccumulator__factory(ethersSigner).deploy(numberOfLocks, primesPerLock, BYTES_PER_uint256)

    const second256BitPrime = BigNumber.from('0xf6876683602570c564a79e91b1887a8264a2119dee04cccd947e5f9603afd80b')
    const arbitraryComposite = 0x4
    await randomNumberAccumulator.accumulate(_256BitPrime)
    await randomNumberAccumulator.accumulate(arbitraryComposite)
    await randomNumberAccumulator.accumulate(second256BitPrime)

    const lockGenerated = BigNumber.from(await randomNumberAccumulator.locks(0))
    const lockExpected = BigNumber.from('0xbf17a49f966c36768e3538f08e090b67bf4047dc6d9b37fea73ba093280d5fc51abc03c6ea95cd422422d2202c9665d113b520cfd15bfb1588f2ac0f3ad87d21')
    expect(await randomNumberAccumulator.isDone()).to.be.eq(true)
    expect(lockGenerated.eq(lockExpected)).to.eq(true)
  })

  it('should use only the prime numbers and pair them correctly for two locks', async () => {
    const numberOfLocks = 2
    const primesPerLock = 2
    randomNumberAccumulator = await new RandomNumberAccumulator__factory(ethersSigner).deploy(numberOfLocks, primesPerLock, BYTES_PER_uint256)

    const additionalPrimes = [
      '0xf6876683602570c564a79e91b1887a8264a2119dee04cccd947e5f9603afd80b',
      '0xa926b2b3664fca1e784a66de9e0d2e8ca75cbb4832104d21892a692e9068b4a9',
      '0xf891cd1b2f83e43a89b2f6f867e45faf8fbbe0c38b77e6d7f18b1db49752b05d'
    ]
    const arbitraryComposite = 0x4
    const orderToSend = [
      _256BitPrime,
      additionalPrimes[0],
      additionalPrimes[1],
      arbitraryComposite,
      additionalPrimes[2]
    ].map(hex => BigNumber.from(hex))
    for (const num of orderToSend) {
      await randomNumberAccumulator.accumulate(num, HIGHER_GAS_LIMIT_OPTION)
    }

    const locksGenerated = (await Promise.all([0, 1]
      .map(async lockNumber => randomNumberAccumulator.locks(lockNumber))))
      .map(lockGenerated => BigNumber.from(lockGenerated))
    const locksExpected = [
      '0xbf17a49f966c36768e3538f08e090b67bf4047dc6d9b37fea73ba093280d5fc51abc03c6ea95cd422422d2202c9665d113b520cfd15bfb1588f2ac0f3ad87d21',
      '0xa43dd38ef64e0142358d27c4098a5df134a34bc870dce70fe3bce664a43726c453bf692b1c629b5581cd3f2cd8840d34161764df2b5ecd11bba9691fff5fd165'
    ].map(hex => BigNumber.from(hex))
    expect(await randomNumberAccumulator.isDone()).to.be.eq(true)

    const matchExpected = locksGenerated.every((generatedLock, lockNumber) => generatedLock.eq(locksExpected[lockNumber]))
    expect(matchExpected).to.eq(true)
  })

  describe('distinct primes', () => {
    it.only('should not allow the same prime in a row', async () => {
      const numberOfLocks = 1
      const primesPerLock = 2
      randomNumberAccumulator = await new RandomNumberAccumulator__factory(ethersSigner).deploy(numberOfLocks, primesPerLock, BYTES_PER_uint256)

      for (let i = 0; i < 2; i++) await randomNumberAccumulator.accumulate(_256BitPrime)

      const lockIsSet = (await randomNumberAccumulator.locks(1)).length !== 0
      expect(await randomNumberAccumulator.isDone()).to.be.eq(false)
      expect(lockIsSet).to.eq(false)
    })
  })
})
