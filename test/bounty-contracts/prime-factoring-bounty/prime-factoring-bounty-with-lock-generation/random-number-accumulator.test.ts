import { ethers } from 'hardhat'
import { RandomNumberAccumulator, RandomNumberAccumulator__factory } from '../../../../typechain'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { arrayify } from 'ethers/lib/utils'

describe('RandomNumberAccumulator', () => {
  const BYTES_PER_uint256 = 32
  const BITS_PER_BYTE = 8

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

  it('should append sequential numbers to reach the required bytes', async () => {
    const numberOfLocks = 1
    const primesPerLock = 1
    const bytesPerPrime = BYTES_PER_uint256 * 2
    randomNumberAccumulator = await new RandomNumberAccumulator__factory(ethersSigner).deploy(numberOfLocks, primesPerLock, bytesPerPrime)

    const _512BitPrime = BigNumber.from(arrayify('0xdf122aa1a14be816462ac30f4074c042e899276cfdf4f1c1943ba244edbc904a03faf637e7d554021160496e96dc35afc16758473036077af0ecda7290509a89'))
    const firstHalf = _512BitPrime.shr(BYTES_PER_uint256 * BITS_PER_BYTE)
    const secondHalf = _512BitPrime.mask(BYTES_PER_uint256 * BITS_PER_BYTE)
    await randomNumberAccumulator.accumulate(firstHalf)
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
})
