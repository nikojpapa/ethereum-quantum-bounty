import { RsaUfoAccumulator__factory } from '../../../../typechain'
import { ethers } from 'hardhat'
import { randomBytes } from 'ethers/lib/utils'
import { expect } from 'chai'
import { Buffer } from 'buffer'

describe('RsaUfoAccumulator', () => {
  const ethersSigner = ethers.provider.getSigner()

  const bytesOfLockPerByteOfPrime = 3

  it('should return the bytes directly if they are the exact size of the lock', async () => {
    const numberOfLocks = 1
    const bytesPerPrime = 1
    const rsaUfoAccumulator = await new RsaUfoAccumulator__factory(ethersSigner).deploy(numberOfLocks, bytesPerPrime)

    const randomness = Buffer.from(randomBytes(bytesOfLockPerByteOfPrime))
    await rsaUfoAccumulator.accumulate(randomness)

    expect(await rsaUfoAccumulator.isDone()).to.be.eq(true)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq(`0x${randomness.toString('hex')}`)
  })

  it('should slice excess bytes', async () => {
    const numberOfLocks = 1
    const bytesPerPrime = 1
    const rsaUfoAccumulator = await new RsaUfoAccumulator__factory(ethersSigner).deploy(numberOfLocks, bytesPerPrime)

    const randomness = Buffer.from(randomBytes(bytesOfLockPerByteOfPrime + 1))
    await rsaUfoAccumulator.accumulate(randomness)

    expect(await rsaUfoAccumulator.isDone()).to.be.eq(true)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq(`0x${randomness.toString('hex').slice(0, 2 * bytesOfLockPerByteOfPrime)}`)
  })

  it('should require multiple accumulations if first is not enough', async () => {
    const numberOfLocks = 1
    const bytesPerPrime = 2
    const rsaUfoAccumulator = await new RsaUfoAccumulator__factory(ethersSigner).deploy(numberOfLocks, bytesPerPrime)

    const randomness = Buffer.from(randomBytes(bytesOfLockPerByteOfPrime))
    await rsaUfoAccumulator.accumulate(randomness)
    expect(await rsaUfoAccumulator.isDone()).to.be.eq(false)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq('0x')

    const randomness2 = Buffer.from(randomBytes(bytesOfLockPerByteOfPrime))
    await rsaUfoAccumulator.accumulate(randomness2)
    const randomnessHex1 = randomness.toString('hex')
    const randomnessHex2 = randomness2.toString('hex')
    expect(await rsaUfoAccumulator.isDone()).to.be.eq(true)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq(`0x${randomnessHex1}${randomnessHex2}`)
  })

  it('should not finish until all locks have been acquired', async () => {
    const numberOfLocks = 2
    const bytesPerPrime = 1
    const rsaUfoAccumulator = await new RsaUfoAccumulator__factory(ethersSigner).deploy(numberOfLocks, bytesPerPrime)

    const randomness = Buffer.from(randomBytes(bytesOfLockPerByteOfPrime))
    await rsaUfoAccumulator.accumulate(randomness)
    const expectedLockHex1 = `0x${randomness.toString('hex')}`
    expect(await rsaUfoAccumulator.isDone()).to.be.eq(false)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq(expectedLockHex1)

    const randomness2 = Buffer.from(randomBytes(bytesOfLockPerByteOfPrime))
    await rsaUfoAccumulator.accumulate(randomness2)
    const expectedLockHex2 = `0x${randomness2.toString('hex')}`
    expect(await rsaUfoAccumulator.isDone()).to.be.eq(true)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq(expectedLockHex1)
    expect(await rsaUfoAccumulator.locks(1)).to.be.eq(expectedLockHex2)
  })

  it('should not continue to accumulate if already done', async () => {
    const numberOfLocks = 1
    const bytesPerPrime = 1
    const rsaUfoAccumulator = await new RsaUfoAccumulator__factory(ethersSigner).deploy(numberOfLocks, bytesPerPrime)

    const randomness = Buffer.from(randomBytes(bytesOfLockPerByteOfPrime))
    await rsaUfoAccumulator.accumulate(randomness)
    const expectedLockHex1 = `0x${randomness.toString('hex')}`
    expect(await rsaUfoAccumulator.isDone()).to.be.eq(true)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq(expectedLockHex1)

    const randomness2 = Buffer.from(randomBytes(bytesOfLockPerByteOfPrime))
    await rsaUfoAccumulator.accumulate(randomness2)
    expect(await rsaUfoAccumulator.isDone()).to.be.eq(true)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq(expectedLockHex1)
  })
})
