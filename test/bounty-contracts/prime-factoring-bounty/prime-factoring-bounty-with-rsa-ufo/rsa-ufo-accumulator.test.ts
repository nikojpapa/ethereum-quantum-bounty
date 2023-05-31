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

  let rsaUfoAccumulator: RsaUfoAccumulator

  async function deployNewRsaUfoAccumulator (numberOfLocks: number, bytesPerPrime: number): Promise<RsaUfoAccumulator> {
    return await new RsaUfoAccumulator__factory(ethersSigner).deploy(numberOfLocks, bytesPerPrime)
  }

  async function expectDone (expectedValue: boolean): Promise<void> {
    expect(await rsaUfoAccumulator.isDone()).to.be.eq(expectedValue)
  }

  async function expectLock (lockNumber: number, expectedValue: string): Promise<void> {
    expect(await rsaUfoAccumulator.locks(lockNumber)).to.be.eq(expectedValue)
  }

  describe('exact right size input', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 1
      rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

      await rsaUfoAccumulator.accumulate(randomness[0].buffer)
    })

    it('should be marked as done', async () => {
      await expectDone(true)
    })

    it('should have a lock matching the input', async () => {
      await expectLock(0, randomness[0].hexWithPrefix)
    })
  })

  describe('slicing off extra bytes', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 1
      rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

      await rsaUfoAccumulator.accumulate(Buffer.concat([randomness[0].buffer, randomness[1].buffer]))
    })

    it('should be marked as done', async () => {
      await expectDone(true)
    })

    it('should have a lock with only the necessary bytes', async () => {
      await expectLock(0, randomness[0].hexWithPrefix)
    })
  })

  describe('multiple accumulations per lock', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 2
      rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

      await rsaUfoAccumulator.accumulate(randomness[0].buffer)
    })

    describe('first accumulation', () => {
      it('should not be marked as done', async () => {
        await expectDone(false)
      })

      it('should have no locks', async () => {
        await expectLock(0, '0x')
      })
    })

    describe('second accumulation', () => {
      beforeEach(async () => {
        await rsaUfoAccumulator.accumulate(randomness[1].buffer)
      })

      it('should be marked as done', async () => {
        await expectDone(true)
      })

      it('should have a lock equal to both inputs', async () => {
        await expectLock(0, `0x${randomness[0].hexString}${randomness[1].hexString}`)
      })
    })
  })

  describe('multiple locks', () => {
    beforeEach(async () => {
      const numberOfLocks = 2
      const bytesPerPrime = 1
      rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

      await rsaUfoAccumulator.accumulate(randomness[0].buffer)
    })

    describe('first accumulation', () => {
      it('should not be marked as done', async () => {
        await expectDone(false)
      })

      it('should have the first lock equal to the input', async () => {
        await expectLock(0, randomness[0].hexWithPrefix)
      })

      it('should have no second lock', async () => {
        await expectLock(1, '0x')
      })
    })

    describe('second accumulation', () => {
      beforeEach(async () => {
        await rsaUfoAccumulator.accumulate(randomness[1].buffer)
      })

      it('should be marked as done', async () => {
        await expectDone(true)
      })

      it('should have the first lock equal to the first input', async () => {
        await expectLock(0, randomness[0].hexWithPrefix)
      })

      it('should have the second lock equal to the second input', async () => {
        await expectLock(1, randomness[1].hexWithPrefix)
      })
    })
  })

  describe('already done', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 1
      rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

      await rsaUfoAccumulator.accumulate(randomness[0].buffer)
    })

    describe('first accumulation', () => {
      it('should be marked as done', async () => {
        await expectDone(true)
      })

      it('should have the first lock equal to the input', async () => {
        await expectLock(0, randomness[0].hexWithPrefix)
      })
    })

    describe('unnecessary, additional accumulation', () => {
      it('should be marked as done', async () => {
        await expectDone(true)
      })

      it('should have the first lock equal to the first input', async () => {
        await expectLock(0, randomness[0].hexWithPrefix)
      })
    })
  })
})
