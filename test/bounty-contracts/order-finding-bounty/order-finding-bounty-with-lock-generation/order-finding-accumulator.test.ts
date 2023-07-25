import { OrderFindingAccumulatorTestHelper, OrderFindingAccumulatorTestHelper__factory } from '../../../../typechain'
import { ethers } from 'hardhat'
import { arrayify } from 'ethers/lib/utils'
import { expect } from 'chai'
import { Buffer } from 'buffer'

describe('OrderFindingAccumulator', () => {
  const ethersSigner = ethers.provider.getSigner()

  let accumulator: OrderFindingAccumulatorTestHelper

  async function deployNewAccumulator (numberOfLocks: number, bytesPerPrime: number): Promise<OrderFindingAccumulatorTestHelper> {
    return await new OrderFindingAccumulatorTestHelper__factory(ethersSigner).deploy(numberOfLocks, bytesPerPrime)
  }

  async function expectDone (expectedValue: boolean): Promise<void> {
    expect(await accumulator.generationIsDone()).to.be.eq(expectedValue)
  }

  async function expectLockParameter (lockNumber: number, lockParameterNumber: number, expectedValue: string): Promise<void> {
    expect(await accumulator.locks(lockNumber, lockParameterNumber)).to.be.eq(expectedValue)
  }

  async function expectLock (lockNumber: number, expectedValues: string[]): Promise<void> {
    for (let i = 0; i < (await accumulator.parametersPerLock()); i++) {
      await expectLockParameter(lockNumber, i, expectedValues[i])
    }
  }

  async function accumulateValues (hexStrings: string[]): Promise<void> {
    for (const hexString of hexStrings) {
      await accumulator.triggerAccumulate(Buffer.from(arrayify(hexString)))
    }
  }

  it('should ensure the base is less than the modulus', async () => {
    expect.fail('No test implemented')
  })

  it('should ensure the base is greater than 1', async () => {
    expect.fail('No test implemented')
  })

  it('should set the first bit of the modulus to 1', async () => {
    expect.fail('No test implemented')
  })

  it('should not set the first bit of the base', async () => {
    expect.fail('No test implemented')
  })

  it('should not set the first bit of subsequent accumulations of the modulus', async () => {
    expect.fail('No test implemented')
  })

  describe('exact right size input', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 1
      accumulator = await deployNewAccumulator(numberOfLocks, bytesPerPrime)
      await accumulateValues(['0xf5', '0x3c'])
    })

    it('should be marked as done', async () => {
      await expectDone(true)
    })

    it('should have a lock matching the input', async () => {
      await expectLock(0, ['0xfa', '0x3c'])
    })
  })

  describe('slicing off extra bytes', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 1
      accumulator = await deployNewAccumulator(numberOfLocks, bytesPerPrime)
      await accumulateValues(['0xf5d4', '0x3c8c'])
    })

    it('should be marked as done', async () => {
      await expectDone(true)
    })

    it('should have a lock with only the necessary bytes', async () => {
      await expectLock(0, ['0xfa', '0x3c'])
    })
  })

  describe('multiple accumulations per lock', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 2
      accumulator = await deployNewAccumulator(numberOfLocks, bytesPerPrime)
      await accumulateValues(['0xf5', '0x3c', '0x8c'])
    })

    describe('first accumulation', () => {
      it('should not be marked as done', async () => {
        await expectDone(false)
      })

      it('should have only the first parameter of the first lock', async () => {
        await expectLockParameter(0, 0, '0xfa9e')
        await expectLockParameter(0, 1, '0x')
      })
    })

    describe('second accumulation', () => {
      beforeEach(async () => {
        await accumulateValues(['0x00'])
      })

      it('should be marked as done', async () => {
        await expectDone(true)
      })

      it('should have a lock equal to both inputs', async () => {
        await expectLockParameter(0, 0, '0xfa9e')
        await expectLockParameter(0, 1, '0x8c00')
      })
    })
  })

  describe('multiple locks', () => {
    beforeEach(async () => {
      const numberOfLocks = 2
      const bytesPerPrime = 1
      accumulator = await deployNewAccumulator(numberOfLocks, bytesPerPrime)
      await accumulateValues(['0xf5', '0x3c'])
    })

    describe('first accumulation', () => {
      it('should not be marked as done', async () => {
        await expectDone(false)
      })

      it('should have the first lock equal to the input', async () => {
        await expectLock(0, ['0xfa', '0x3c'])
      })

      it('should have no second lock', async () => {
        await expectLock(1, ['0x', '0x'])
      })
    })

    describe('second accumulation', () => {
      beforeEach(async () => {
        await accumulateValues(['0x8c', '0x00'])
      })

      it('should be marked as done', async () => {
        await expectDone(true)
      })

      it('should have the first lock equal to the first input', async () => {
        await expectLock(0, ['0xfa', '0x3c'])
      })

      it('should have the second lock equal to the second input', async () => {
        await expectLock(1, ['0xc6', '0x00'])
      })
    })
  })

  describe('already done', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerPrime = 1
      accumulator = await deployNewAccumulator(numberOfLocks, bytesPerPrime)
      await accumulateValues(['0xf5', '0x3c'])
    })

    describe('first accumulation', () => {
      it('should be marked as done', async () => {
        await expectDone(true)
      })

      it('should have the first lock equal to the input', async () => {
        await expectLock(0, ['0xfa', '0x3c'])
      })
    })

    describe('unnecessary, additional accumulation', () => {
      beforeEach(async () => {
        await accumulateValues(['0x8c', '0x00'])
      })

      it('should be marked as done', async () => {
        await expectDone(true)
      })

      it('should have the first lock equal to the first input', async () => {
        await expectLock(0, ['0xfa', '0x3c'])
      })
    })
  })
})
