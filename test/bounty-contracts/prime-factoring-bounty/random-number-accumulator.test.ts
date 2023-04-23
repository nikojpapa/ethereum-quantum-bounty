import { ethers } from 'hardhat'
import { RandomNumberAccumulator, RandomNumberAccumulator__factory } from '../../../typechain'
import { expect } from 'chai'

describe('RandomNumberAccumulator', () => {
  const BYTES_PER_uint256 = 32

  const ethersSigner = ethers.provider.getSigner()
  let randomNumberAccumulator: RandomNumberAccumulator

  it('should not be done if not enough bytes', async () => {
    const numberOfLocks = 1
    const primesPerLock = 1
    const bytesPerPrime = BYTES_PER_uint256 + 1
    randomNumberAccumulator = await new RandomNumberAccumulator__factory(ethersSigner).deploy(numberOfLocks, primesPerLock, bytesPerPrime)
    await randomNumberAccumulator.accumulate(1)
    expect(await randomNumberAccumulator.isDone()).to.be.eq(false)
  })

  it('should set the first byte to 1', async () => {
    const numberOfLocks = 1
    const primesPerLock = 1
    const bytesPerPrime = BYTES_PER_uint256
    randomNumberAccumulator = await new RandomNumberAccumulator__factory(ethersSigner).deploy(numberOfLocks, primesPerLock, bytesPerPrime)
    await randomNumberAccumulator.accumulate(1)
    expect(await randomNumberAccumulator.isDone()).to.be.eq(true)
  })
})
