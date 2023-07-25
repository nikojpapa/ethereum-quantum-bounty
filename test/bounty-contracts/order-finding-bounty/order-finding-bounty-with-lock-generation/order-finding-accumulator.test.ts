import { OrderFindingAccumulatorTestHelper, OrderFindingAccumulatorTestHelper__factory } from '../../../../typechain'
import { ethers } from 'hardhat'
import { arrayify, randomBytes } from 'ethers/lib/utils'
import { expect } from 'chai'
import { Buffer } from 'buffer'

// const BYTES_PER_LOCK_PARAMETER = 3
//
// class RandomBytes {
//   public buffer: Buffer
//   public hexString: string
//   public hexWithPrefix: string
//
//   constructor (hexStringWithPrefix?: string) {
//     this.buffer = Buffer.from(hexStringWithPrefix ?? randomBytes(BYTES_PER_LOCK_PARAMETER))
//     this.hexString = this.buffer.toString('hex')
//     this.hexWithPrefix = `0x${this.hexString}`
//   }
// }

describe('OrderFindingAccumulator', () => {
  const ethersSigner = ethers.provider.getSigner()
  // const randomness = [
  //   new RandomBytes('0xaed41d'),
  //   new RandomBytes('0xf58c1f')
  // ]

  let accumulator: OrderFindingAccumulatorTestHelper

  async function deployNewAccumulator (numberOfLocks: number, bytesPerPrime: number): Promise<OrderFindingAccumulatorTestHelper> {
    return await new OrderFindingAccumulatorTestHelper__factory(ethersSigner).deploy(numberOfLocks, bytesPerPrime)
  }

  async function expectDone (expectedValue: boolean): Promise<void> {
    expect(await accumulator.generationIsDone()).to.be.eq(expectedValue)
  }

  async function expectLock (lockNumber: number, lockParameterNumber: number, expectedValue: string): Promise<void> {
    expect(await accumulator.locks(lockNumber, lockParameterNumber)).to.be.eq(expectedValue)
  }

  it('should ensure the base is less than the modulus', async () => {
    expect.fail('No test implemented')
  })

  it('should set the first bit of the modulus to 1', async () => {
    expect.fail('No test implemented')
  })

  it('should not set the first bit of the base', async () => {
    expect.fail('No test implemented')
  })

  describe('exact right size input', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 1
      accumulator = await deployNewAccumulator(numberOfLocks, bytesPerPrime)

      for (const rand of ['0xf5', '0x3c']) {
        await accumulator.triggerAccumulate(Buffer.from(arrayify(rand)))
      }
    })

    it('should be marked as done', async () => {
      await expectDone(true)
    })

    it('should have a lock matching the input', async () => {
      const expectedValues = ['0xfa', '0x3c']
      for (let i = 0; i < (await accumulator.parametersPerLock()); i++) {
        await expectLock(0, i, expectedValues[i])
      }
    })
  })

  describe('slicing off extra bytes', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 1
      accumulator = await deployNewAccumulator(numberOfLocks, bytesPerPrime)

      for (const rand of ['0xf5d4', '0x3c8c']) {
        await accumulator.triggerAccumulate(Buffer.from(arrayify(rand)))
      }
    })

    it('should be marked as done', async () => {
      await expectDone(true)
    })

    it('should have a lock with only the necessary bytes', async () => {
      const expectedValues = ['0xfa', '0x3c']
      for (let i = 0; i < (await accumulator.parametersPerLock()); i++) {
        await expectLock(0, i, expectedValues[i])
      }
    })
  })

  describe('multiple accumulations per lock', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 2
      accumulator = await deployNewAccumulator(numberOfLocks, bytesPerPrime)

      for (const rand of ['0xf5', '0x3c', '0x8c']) {
        await accumulator.triggerAccumulate(Buffer.from(arrayify(rand)))
      }
    })

    describe('first accumulation', () => {
      it('should not be marked as done', async () => {
        await expectDone(false)
      })

      it('should have only the first parameter of the first lock', async () => {
        await expectLock(0, 0, '0xfa9e')
      })
    })

    describe('second accumulation', () => {
      beforeEach(async () => {
        await accumulator.triggerAccumulate(Buffer.from(arrayify('0x00')))
      })

      it('should be marked as done', async () => {
        await expectDone(true)
      })

      it('should have a lock equal to both inputs', async () => {
        await expectLock(0, 0, '0xfa9e')
        await expectLock(0, 1, '0x8c00')
      })
    })
  })

  describe('multiple locks', () => {
    beforeEach(async () => {
      const numberOfLocks = 2
      const bytesPerPrime = 1
      accumulator = await deployNewAccumulator(numberOfLocks, bytesPerPrime)

      for (const rand of ['0xf5', '0x3c']) {
        await accumulator.triggerAccumulate(Buffer.from(arrayify(rand)))
      }
    })

    describe('first accumulation', () => {
      it('should not be marked as done', async () => {
        await expectDone(false)
      })

      it('should have the first lock equal to the input', async () => {
        const expectedValues = ['0xfa', '0x3c']
        for (let i = 0; i < (await accumulator.parametersPerLock()); i++) {
          await expectLock(0, i, expectedValues[i])
        }
      })

      it('should have no second lock', async () => {
        for (let i = 0; i < (await accumulator.parametersPerLock()); i++) {
          await expectLock(1, i, '0x')
        }
      })
    })

    describe('second accumulation', () => {
      beforeEach(async () => {
        for (const rand of ['0x8c', '0x00']) {
          await accumulator.triggerAccumulate(Buffer.from(arrayify(rand)))
        }
      })

      it('should be marked as done', async () => {
        await expectDone(true)
      })

      it('should have the first lock equal to the first input', async () => {
        const expectedValues = ['0xfa', '0x3c']
        for (let i = 0; i < (await accumulator.parametersPerLock()); i++) {
          await expectLock(0, i, expectedValues[i])
        }
      })

      it('should have the second lock equal to the second input', async () => {
        const expectedValues = ['0xc6', '0x00']
        for (let i = 0; i < (await accumulator.parametersPerLock()); i++) {
          await expectLock(1, i, expectedValues[i])
        }
      })
    })
  })

  describe('already done', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 1
      accumulator = await deployNewAccumulator(numberOfLocks, bytesPerPrime)

      await accumulator.triggerAccumulate(randomness[0].buffer)
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
