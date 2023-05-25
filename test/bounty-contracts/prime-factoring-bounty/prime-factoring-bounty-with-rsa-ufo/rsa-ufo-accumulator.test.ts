import { RsaUfoAccumulator, RsaUfoAccumulator__factory } from '../../../../typechain'
import { ethers } from 'hardhat'
import { randomBytes } from 'ethers/lib/utils'
import { expect } from 'chai'
import { Buffer } from 'buffer'

const BYTES_OF_LOCK_PER_BYTE_OF_PRIME = 3

class RandomBytes {
  public buffer: Buffer
  public hexString: string
  public hexWithPrefix: string

  constructor () {
    this.buffer = Buffer.from(randomBytes(BYTES_OF_LOCK_PER_BYTE_OF_PRIME))
    this.hexString = this.buffer.toString('hex')
    this.hexWithPrefix = `0x${this.hexString}`
  }
}

describe('RsaUfoAccumulator', () => {
  const ethersSigner = ethers.provider.getSigner()

  const randomness = new Array(2).fill(0).map(() => new RandomBytes())

  async function deployNewRsaUfoAccumulator (numberOfLocks: number, bytesPerPrime: number): Promise<RsaUfoAccumulator> {
    return await new RsaUfoAccumulator__factory(ethersSigner).deploy(numberOfLocks, bytesPerPrime)
  }

  it('should return the bytes directly if they are the exact size of the lock', async () => {
    const numberOfLocks = 1
    const bytesPerPrime = 1
    const rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

    await rsaUfoAccumulator.accumulate(randomness[0].buffer)

    expect(await rsaUfoAccumulator.isDone()).to.be.eq(true)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq(randomness[0].hexWithPrefix)
  })

  it('should slice excess bytes', async () => {
    const numberOfLocks = 1
    const bytesPerPrime = 1
    const rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

    await rsaUfoAccumulator.accumulate(Buffer.concat([randomness[0].buffer, randomness[1].buffer]))

    expect(await rsaUfoAccumulator.isDone()).to.be.eq(true)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq(randomness[0].hexWithPrefix)
  })

  it('should require multiple accumulations if first is not enough', async () => {
    const numberOfLocks = 1
    const bytesPerPrime = 2
    const rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

    await rsaUfoAccumulator.accumulate(randomness[0].buffer)
    expect(await rsaUfoAccumulator.isDone()).to.be.eq(false)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq('0x')

    await rsaUfoAccumulator.accumulate(randomness[1].buffer)
    expect(await rsaUfoAccumulator.isDone()).to.be.eq(true)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq(`0x${randomness[0].hexString}${randomness[1].hexString}`)
  })

  it('should not finish until all locks have been acquired', async () => {
    const numberOfLocks = 2
    const bytesPerPrime = 1
    const rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

    await rsaUfoAccumulator.accumulate(randomness[0].buffer)
    expect(await rsaUfoAccumulator.isDone()).to.be.eq(false)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq(randomness[0].hexWithPrefix)

    await rsaUfoAccumulator.accumulate(randomness[1].buffer)
    expect(await rsaUfoAccumulator.isDone()).to.be.eq(true)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq(randomness[0].hexWithPrefix)
    expect(await rsaUfoAccumulator.locks(1)).to.be.eq(randomness[1].hexWithPrefix)
  })

  it('should not continue to accumulate if already done', async () => {
    const numberOfLocks = 1
    const bytesPerPrime = 1
    const rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

    await rsaUfoAccumulator.accumulate(randomness[0].buffer)
    expect(await rsaUfoAccumulator.isDone()).to.be.eq(true)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq(randomness[0].hexWithPrefix)

    await rsaUfoAccumulator.accumulate(randomness[1].buffer)
    expect(await rsaUfoAccumulator.isDone()).to.be.eq(true)
    expect(await rsaUfoAccumulator.locks(0)).to.be.eq(randomness[0].hexWithPrefix)
  })
})
