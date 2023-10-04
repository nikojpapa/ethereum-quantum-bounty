import { RsaUfoAccumulatorTestHelper, RsaUfoAccumulatorTestHelper__factory } from '../../../../typechain'
import { ethers } from 'hardhat'
import { arrayify } from 'ethers/lib/utils'
import { expect } from 'chai'
import { Buffer } from 'buffer'

describe('RsaUfoAccumulator', () => {
  const ethersSigner = ethers.provider.getSigner()
  let rsaUfoAccumulator: RsaUfoAccumulatorTestHelper

  async function deployNewRsaUfoAccumulator (numberOfLocks: number, bytesPerPrime: number): Promise<RsaUfoAccumulatorTestHelper> {
    return await new RsaUfoAccumulatorTestHelper__factory(ethersSigner).deploy(numberOfLocks, bytesPerPrime)
  }

  async function expectDone (expectedValue: boolean): Promise<void> {
    expect((await rsaUfoAccumulator.accumulator()).generationIsDone).to.be.eq(expectedValue)
  }

  async function expectLock (lockNumber: number, expectedValue: string): Promise<void> {
    const accumulator = await rsaUfoAccumulator.accumulator()
    const lockValue = accumulator.locks.vals[lockNumber][0]
    expect(lockValue).to.be.eq(expectedValue)
  }

  describe('exact right size input', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 1
      rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

      await rsaUfoAccumulator.triggerAccumulate('0x02')
    })

    it('should be marked as done', async () => {
      await expectDone(true)
    })

    it('should have a lock matching the input', async () => {
      await expectLock(0, '0x02')
    })
  })

  describe('slicing off extra bytes', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 1
      rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

      await rsaUfoAccumulator.triggerAccumulate(Buffer.concat([Buffer.from(arrayify('0x02')), Buffer.from(arrayify('0xa6'))]))
    })

    it('should be marked as done', async () => {
      await expectDone(true)
    })

    it('should have a lock with only the necessary bytes', async () => {
      await expectLock(0, '0x02')
    })
  })

  describe('multiple accumulations per lock', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 2
      rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

      await rsaUfoAccumulator.triggerAccumulate('0x02')
    })

    describe('first accumulation', () => {
      it('should not be marked as done', async () => {
        await expectDone(false)
      })

      it('should have no locks', async () => {
        const accumulator = await rsaUfoAccumulator.accumulator()
        expect(accumulator.locks.vals[0].length).to.eq(0)
      })
    })

    describe('second accumulation', () => {
      beforeEach(async () => {
        await rsaUfoAccumulator.triggerAccumulate('0xa6')
      })

      it('should be marked as done', async () => {
        await expectDone(true)
      })

      it('should have a lock equal to both inputs', async () => {
        await expectLock(0, '0x02a6')
      })
    })
  })

  describe('multiple locks', () => {
    beforeEach(async () => {
      const numberOfLocks = 2
      const bytesPerPrime = 1
      rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

      await rsaUfoAccumulator.triggerAccumulate('0x02')
    })

    describe('first accumulation', () => {
      it('should not be marked as done', async () => {
        await expectDone(false)
      })

      it('should have the first lock equal to the input', async () => {
        await expectLock(0, '0x02')
      })

      it('should have no second lock', async () => {
        const accumulator = await rsaUfoAccumulator.accumulator()
        expect(accumulator.locks.vals[1].length).to.eq(0)
      })
    })

    describe('second accumulation', () => {
      beforeEach(async () => {
        await rsaUfoAccumulator.triggerAccumulate('0xa6')
      })

      it('should be marked as done', async () => {
        await expectDone(true)
      })

      it('should have the first lock equal to the first input', async () => {
        await expectLock(0, '0x02')
      })

      it('should have the second lock equal to the second input', async () => {
        await expectLock(1, '0xa6')
      })
    })
  })

  describe('already done', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 1
      rsaUfoAccumulator = await deployNewRsaUfoAccumulator(numberOfLocks, bytesPerPrime)

      await rsaUfoAccumulator.triggerAccumulate('0x02')
    })

    describe('first accumulation', () => {
      it('should be marked as done', async () => {
        await expectDone(true)
      })

      it('should have the first lock equal to the input', async () => {
        await expectLock(0, '0x02')
      })
    })

    describe('unnecessary, additional accumulation', () => {
      beforeEach(async () => {
        await rsaUfoAccumulator.triggerAccumulate('0xa6')
      })

      it('should be marked as done', async () => {
        await expectDone(true)
      })

      it('should have the first lock equal to the first input', async () => {
        await expectLock(0, '0x02')
      })
    })
  })
})
