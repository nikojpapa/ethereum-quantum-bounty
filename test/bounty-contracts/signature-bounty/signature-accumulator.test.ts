import { SignatureAccumulatorTestHelper, SignatureAccumulatorTestHelper__factory } from '../../../typechain'
import { ethers } from 'hardhat'
import { arrayify } from 'ethers/lib/utils'
import { expect } from 'chai'
import { Buffer } from 'buffer'

describe('SignatureAccumulator', () => {
  const ethersSigner = ethers.provider.getSigner()

  let testHelper: SignatureAccumulatorTestHelper

  async function accumulator (): Promise<any> {
    return await testHelper.accumulator()
  }

  async function deployNewAccumulator (numberOfLocks: number, bytesPerPrime: number): Promise<SignatureAccumulatorTestHelper> {
    return await new SignatureAccumulatorTestHelper__factory(ethersSigner).deploy(numberOfLocks, bytesPerPrime)
  }

  async function expectDone (expectedValue: boolean): Promise<void> {
    expect((await accumulator()).generationIsDone).to.be.eq(expectedValue)
  }

  async function expectLockParameter (lockNumber: number, lockParameterNumber: number, expectedValue: string): Promise<void> {
    expect((await accumulator()).locks.vals[lockNumber][lockParameterNumber]).to.be.eq(expectedValue)
  }

  async function expectLock (lockNumber: number, expectedValues: string[]): Promise<void> {
    for (let i = 0; i < (await accumulator()).parametersPerLock; i++) {
      await expectLockParameter(lockNumber, i, expectedValues[i])
    }
  }

  async function accumulateValues (hexStrings: string[]): Promise<void> {
    for (const hexString of hexStrings) {
      await testHelper.triggerAccumulate(Buffer.from(arrayify(hexString)))
      while ((await testHelper.callStatic.isCheckingPrime())) {
        await testHelper.triggerAccumulate([])
      }
    }
  }

  describe('exact right size input', () => {
    beforeEach(async () => {
      const numberOfLocks = 1
      const bytesPerLock = 1
      testHelper = await deployNewAccumulator(numberOfLocks, bytesPerLock)
      await accumulateValues(['0xf5'])
    })

    it('should be marked as done', async () => {
      await expectDone(true)
    })

    it('should have a lock matching the input', async () => {
      await expectLock(0, ['0xf5'])
    })
  })

  // describe('slicing off extra bytes', () => {
  //   beforeEach(async () => {
  //     const numberOfLocks = 1
  //     const bytesPerPrime = 1
  //     testHelper = await deployNewAccumulator(numberOfLocks, bytesPerPrime)
  //     await accumulateValues(['0xf5d4', '0x3d8c'])
  //   })
  //
  //   it('should be marked as done', async () => {
  //     await expectDone(true)
  //   })
  //
  //   it('should have a lock with only the necessary bytes', async () => {
  //     await expectLock(0, ['0xf5', '0x3d'])
  //   })
  // })
  //
  // describe('multiple accumulations per lock', () => {
  //   beforeEach(async () => {
  //     const numberOfLocks = 1
  //     const bytesPerPrime = 2
  //     testHelper = await deployNewAccumulator(numberOfLocks, bytesPerPrime)
  //     await accumulateValues(['0xf5', '0x3d', '0x8c'])
  //   })
  //
  //   describe('first accumulation', () => {
  //     it('should not be marked as done', async () => {
  //       await expectDone(false)
  //     })
  //
  //     it('should have only the first parameter of the first lock', async () => {
  //       await expectLockParameter(0, 0, '0xf53d')
  //       await expectLockParameter(0, 1, '0x')
  //     })
  //   })
  //
  //   describe('second accumulation', () => {
  //     beforeEach(async () => {
  //       await accumulateValues(['0x00'])
  //     })
  //
  //     it('should be marked as done', async () => {
  //       await expectDone(true)
  //     })
  //
  //     it('should have a lock equal to both inputs', async () => {
  //       await expectLockParameter(0, 0, '0xf53d')
  //       await expectLockParameter(0, 1, '0x8c00')
  //     })
  //   })
  // })

  // describe('multiple locks', () => {
  //   beforeEach(async () => {
  //     const numberOfLocks = 2
  //     const bytesPerPrime = 1
  //     testHelper = await deployNewAccumulator(numberOfLocks, bytesPerPrime)
  //     await accumulateValues(['0xf5', '0x3d'])
  //   })
  //
  //   describe('first accumulation', () => {
  //     it('should not be marked as done', async () => {
  //       await expectDone(false)
  //     })
  //
  //     it('should have the first lock equal to the input', async () => {
  //       await expectLock(0, ['0xf5', '0x3d'])
  //     })
  //
  //     it('should not have a second lock', async () => {
  //       expect((await accumulator()).locks.vals[1]).to.eql([])
  //     })
  //   })
  //
  //   describe('second accumulation', () => {
  //     beforeEach(async () => {
  //       await accumulateValues(['0x8c', '0x03'])
  //     })
  //
  //     it('should be marked as done', async () => {
  //       await expectDone(true)
  //     })
  //
  //     it('should have the first lock equal to the first input', async () => {
  //       await expectLock(0, ['0xf5', '0x3d'])
  //     })
  //
  //     it('should have the second lock equal to the second input', async () => {
  //       await expectLock(1, ['0x8c', '0x03'])
  //     })
  //   })
  // })
  //
  // describe('already done', () => {
  //   beforeEach(async () => {
  //     const numberOfLocks = 1
  //     const bytesPerPrime = 1
  //     testHelper = await deployNewAccumulator(numberOfLocks, bytesPerPrime)
  //     await accumulateValues(['0xf5', '0x3d'])
  //   })
  //
  //   describe('first accumulation', () => {
  //     it('should be marked as done', async () => {
  //       await expectDone(true)
  //     })
  //
  //     it('should have the first lock equal to the input', async () => {
  //       await expectLock(0, ['0xf5', '0x3d'])
  //     })
  //   })
  //
  //   describe('unnecessary, additional accumulation', () => {
  //     beforeEach(async () => {
  //       await accumulateValues(['0x8c', '0x00'])
  //     })
  //
  //     it('should be marked as done', async () => {
  //       await expectDone(true)
  //     })
  //
  //     it('should have the first lock equal to the first input', async () => {
  //       await expectLock(0, ['0xf5', '0x3d'])
  //     })
  //   })
  // })
})
